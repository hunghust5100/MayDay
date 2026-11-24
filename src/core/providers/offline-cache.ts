import { AESEncryptionKey, AESSealedData, aesDecryptAsync, aesEncryptAsync, digestStringAsync, CryptoDigestAlgorithm } from 'expo-crypto';
import { File, Paths } from 'expo-file-system';
import { AppState, Platform } from 'react-native';

import { queryClient } from '@/core/api';
import { ROLE_IDS, session } from '@/core/auth';
import { env } from '@/core/config';
import { secureStorage } from '@/core/storage';
import { canKeepOffline, OFFLINE_MAX_SIZE, OFFLINE_TTL, selectOfflineEntries, type OfflineEntry } from '@/core/storage/offline-snapshot';

const keyName = 'drmayday.offline_key_v1';
const cacheFile = () => new File(Paths.document, 'offline-v1.dat');
const isNative = Platform.OS === 'ios' || Platform.OS === 'android';

type Snapshot = { scope: string; entries: OfflineEntry[] };

function currentOwner() {
  const auth = session.getState();
  if (auth.status !== 'signedIn' || !session.isRemembered()) return null;
  return { token: auth.token, id: auth.user.user_id, patient: auth.user.role_id === ROLE_IDS.PATIENT };
}

async function scope(token: string) {
  return digestStringAsync(CryptoDigestAlgorithm.SHA256, JSON.stringify([env.apiUrl, env.apiMock, token]));
}

async function clearSnapshot() {
  await secureStorage.remove(keyName);
  const file = cacheFile();
  if (file.exists) file.delete();
}

export async function restoreOfflineCache() {
  if (!isNative) return;
  const owner = currentOwner();
  if (!owner) {
    await clearSnapshot();
    return;
  }
  const file = cacheFile();
  if (!file.exists) return;
  try {
    if (file.size > OFFLINE_MAX_SIZE * 4 + 1024) throw new Error('Offline snapshot too large');
    const rawKey = await secureStorage.get(keyName);
    if (!rawKey) throw new Error('Offline key missing');
    const key = await AESEncryptionKey.import(rawKey, 'hex');
    const data = AESSealedData.fromCombined(await file.bytes());
    const plaintext = await aesDecryptAsync(data, key);
    if (typeof plaintext === 'string') throw new Error('Unexpected snapshot encoding');
    const saved = JSON.parse(new TextDecoder().decode(plaintext)) as Snapshot;
    if (saved.scope !== await scope(owner.token)) throw new Error('Offline scope changed');
    if (session.getToken() !== owner.token) return;
    for (const entry of selectOfflineEntries(saved.entries, owner)) {
      queryClient.setQueryData(entry.key, entry.data, { updatedAt: entry.updatedAt });
    }
  } catch {
    await clearSnapshot();
  }
}

export function startOfflineCache() {
  let previousToken = session.getToken();
  let timer: ReturnType<typeof setTimeout> | undefined;
  let work = Promise.resolve();
  const enqueue = (job: () => Promise<void>) => {
    work = work.then(job).catch(() => {});
  };

  const flush = () => {
    clearTimeout(timer);
    timer = undefined;
    const owner = currentOwner();
    if (!owner) return;
    enqueue(async () => {
      if (session.getToken() !== owner.token) return;
      const entries = selectOfflineEntries(queryClient.getQueryCache().getAll().map(({ queryKey, state }) => ({
        key: queryKey,
        data: state.data,
        updatedAt: state.dataUpdatedAt,
      })), owner);
      const rawKey = await secureStorage.get(keyName);
      const key = rawKey ? await AESEncryptionKey.import(rawKey, 'hex') : await AESEncryptionKey.generate();
      const snapshot: Snapshot = { scope: await scope(owner.token), entries };
      const sealed = await aesEncryptAsync(new TextEncoder().encode(JSON.stringify(snapshot)), key);
      const bytes = await sealed.combined();
      if (session.getToken() !== owner.token) return;
      if (!rawKey) await secureStorage.set(keyName, await key.encoded('hex'));
      const file = cacheFile();
      if (!file.exists) file.create();
      await file.write(bytes);
    });
  };

  const unsubscribeSession = session.subscribe(() => {
    const token = session.getToken();
    if (token === previousToken) return;
    if (previousToken) {
      clearTimeout(timer);
      timer = undefined;
      queryClient.clear();
      if (isNative) enqueue(clearSnapshot);
    }
    previousToken = token;
  });
  // Preserve selected inactive queries for the same interval as their snapshot.
  for (const key of [['profile'], ['notifications', 'list'], ['medical-records', 'list']]) {
    queryClient.setQueryDefaults(key, { gcTime: isNative ? OFFLINE_TTL : 30 * 60 * 1000 });
  }
  if (!isNative) return unsubscribeSession;

  const unsubscribeQueries = queryClient.getQueryCache().subscribe((event) => {
    const owner = currentOwner();
    if (!owner || !canKeepOffline(event.query.queryKey, owner)) return;
    if (event.type !== 'removed' && (event.type !== 'updated' || event.action.type !== 'success')) return;
    clearTimeout(timer);
    timer = setTimeout(flush, 250);
  });
  const appState = AppState.addEventListener('change', (state) => {
    if (state !== 'active' && timer) flush();
  });
  return () => {
    clearTimeout(timer);
    unsubscribeSession();
    unsubscribeQueries();
    appState.remove();
  };
}
