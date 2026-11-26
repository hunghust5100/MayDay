const { isCancelledError, onlineManager, QueryClient } = require('@tanstack/react-query');

const { api } = require('../../src/core/api/client');
const { session } = require('../../src/core/auth/session');
const { canKeepOffline, selectOfflineEntries, OFFLINE_TTL } = require('../../src/core/storage/offline-snapshot');
const { logout } = require('../../src/features/auth/api/logout');

module.exports = async function checkAuthOffline({ assert, test, expect, db, savedSession, setSession }) {
  await test('login validates phone, bad credentials, locked accounts and issues a working session', async () => {
    const user = db.users.get(3);
    const credentials = { phone: user.phone, password: user.password };
    await expect(null, 'POST', '/auth/login', { ...credentials, phone: '123' }, '2004');
    await expect(null, 'POST', '/auth/login', { ...credentials, phone: '0999999999' }, '3007');
    await expect(null, 'POST', '/auth/login', { ...credentials, password: 'wrong password' }, '3008');
    user.is_active = 0;
    await expect(null, 'POST', '/auth/login', credentials, '3101');
    user.is_active = 1;
    const result = await expect(null, 'POST', '/auth/login', credentials);
    assert.equal(result.user_info.user_id, user.user_id);
    assert.ok(result.token);
  });

  await test('offline logout clears remembered credentials, does not fetch, and cannot restore the session', async () => {
    setSession(session);
    onlineManager.setOnline(false);
    try {
      const user = { user_id: 3, full_name: 'Bệnh nhân thử', display_name: 'Thử', phone: '0912345678', role_id: 3 };
      await session.signIn('remembered-token', user);
      await session.restore();
      assert.equal(session.getToken(), 'remembered-token');
      let requests = 0;
      global.fetch = async () => { requests++; throw new Error('Expected no network calls'); };
      await assert.rejects(api.post('/auth/login', {}), { code: 'NETWORK' });
      await logout();
      assert.equal(session.getState().status, 'signedOut');
      assert.equal(savedSession.size, 0);
      await session.restore();
      assert.equal(session.getState().status, 'signedOut');
      assert.equal(requests, 0);
      await session.signIn('temporary-token', user, { remember: false });
      assert.equal(session.isRemembered(), false);
      await session.restore();
      assert.equal(session.getState().status, 'signedOut');
    } finally {
      onlineManager.setOnline(true);
      setSession(undefined);
    }
  });

  await test('online logout uses the previous JWT and FCM token; old replies cannot affect the new session', async () => {
    setSession(session);
    const user = { user_id: 3, full_name: 'Bệnh nhân thử', display_name: 'Thử', phone: '0912345678', role_id: 3 };
    let finish;
    const pendingResponse = new Promise((resolve) => { finish = resolve; });
    const sent = [];
    global.fetch = async (url, options) => {
      sent.push({ url, options });
      return pendingResponse.then(() => new Response(JSON.stringify({ code: '3001', data: {}, message: '' })));
    };
    try {
      await session.signIn('first-token', user);
      const request = api.get('/test');
      const invalidated = assert.rejects(request, (error) => isCancelledError(error));
      await logout();
      assert.equal(session.getToken(), null);
      await session.signIn('second-token', { ...user, user_id: 4 });
      const signOut = sent.find(({ url }) => url.endsWith('/auth/logout'));
      assert.equal(signOut.options.headers.Authorization, 'Bearer first-token');
      assert.deepEqual(JSON.parse(signOut.options.body), { fcm_token: 'device-test-token' });
      finish();
      await invalidated;
      assert.equal(session.getToken(), 'second-token');
    } finally {
      finish();
      await session.signOut();
      setSession(undefined);
    }
  });

  await test('offline snapshot only retains fresh, permitted, bounded data and hydrates with original timestamps', async () => {
    const now = Date.now();
    const patient = { id: 3, patient: true };
    const valid = { key: ['medical-records', 'list', 3, {}, { limit: 20 }], updatedAt: now - 100, data: { pages: [], pageParams: [] } };
    const profile = { key: ['profile'], updatedAt: now - 200, data: { full_name: 'Bệnh nhân thử' } };
    const notification = { key: ['notifications', 'list', { limit: 20 }], updatedAt: now - 300, data: { pages: [], pageParams: [] } };
    const selected = selectOfflineEntries([
      notification, profile, valid,
      { ...valid, key: ['medical-records', 'list', 4, {}] },
      { ...valid, key: ['medical-records', 'detail', 12] },
      { ...valid, key: ['media'] },
      { ...profile, updatedAt: now - OFFLINE_TTL - 1 },
      { ...profile, data: 'x'.repeat(450000) },
    ], patient, now);
    assert.deepEqual(selected, [valid, profile, notification]);
    assert.equal(canKeepOffline(valid.key, { id: 2, patient: false }), false);
    assert.equal(canKeepOffline(notification.key, { id: 2, patient: false }), true);
    const cache = new QueryClient({ defaultOptions: { queries: { gcTime: Infinity } } });
    for (const entry of selected) cache.setQueryData(entry.key, entry.data, { updatedAt: entry.updatedAt });
    assert.deepEqual(cache.getQueryData(profile.key), profile.data);
    assert.equal(cache.getQueryState(profile.key).dataUpdatedAt, profile.updatedAt);
    cache.clear();
    assert.equal(cache.getQueryData(profile.key), undefined);
  });
};
