import type { QueryKey } from '@tanstack/react-query';

export type OfflineEntry = { key: QueryKey; data: unknown; updatedAt: number };

export const OFFLINE_TTL = 24 * 60 * 60 * 1000;
export const OFFLINE_MAX_SIZE = 400_000;

export function canKeepOffline(key: QueryKey, owner: { id: number; patient: boolean }) {
  const [domain, action, id] = key;
  if (domain === 'notifications') return action === 'list';
  if (!owner.patient) return false;
  if (domain === 'profile') return key.length === 1;
  return domain === 'medical-records' && action === 'list' && id === owner.id;
}

export function selectOfflineEntries(
  entries: OfflineEntry[],
  owner: Parameters<typeof canKeepOffline>[1],
  now = Date.now(),
) {
  const selected: OfflineEntry[] = [];
  let remaining = OFFLINE_MAX_SIZE;
  for (const entry of entries.sort((a, b) => b.updatedAt - a.updatedAt)) {
    if (entry.data === undefined || entry.updatedAt <= now - OFFLINE_TTL || entry.updatedAt > now) continue;
    if (!canKeepOffline(entry.key, owner)) continue;
    const length = JSON.stringify(entry).length + 1;
    if (length > remaining) continue;
    remaining -= length;
    selected.push(entry);
  }
  return selected;
}
