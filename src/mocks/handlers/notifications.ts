import { authenticate } from '../core/auth';
import { ok, reject, type MockRequest } from '../core/http';
import { positiveId, strictPaging } from '../core/module-validate';
import type { RouteDef } from '../core/router';
import { readBody } from '../core/validate';
import type { DeviceTokenRow } from '../db/form-types';
import { db, nextId, nowString } from '../db/store';

/** Mock-only endpoint grant, seeded for every role; can be revoked through existing RBAC API. */
function notificationAuth(req: MockRequest) {
  const context = authenticate(req);
  if (!db.role_permissions.some((rp) => rp.role_id === context.user.role_id && db.permissions.get(rp.permission_id)?.name === 'manage_own_notifications')) reject('3101');
  return context;
}
function list(req: MockRequest) {
  const { user } = notificationAuth(req);
  const { offset, limit } = strictPaging(req, 100);
  const rows = [...db.notifications.values()].filter((n) => n.user_id === user.user_id)
    .sort((a, b) => b.created_at.localeCompare(a.created_at) || b.id - a.id);
  return ok(rows.slice(offset, offset + limit), rows.length, { unread_count: rows.filter((n) => n.is_read === 0).length });
}
function owned(req: MockRequest) {
  const { user } = notificationAuth(req); const id = positiveId(req);
  const row = db.notifications.get(id);
  if (!row) reject('9102');
  if (row.user_id !== user.user_id) reject('3106');
  return row;
}
function read(req: MockRequest) {
  const row = owned(req);
  if (row.is_read === 0) { row.is_read = 1; row.updated_at = nowString(); }
  return ok(row);
}
function readAll(req: MockRequest) {
  const { user } = notificationAuth(req); let updated_count = 0;
  for (const row of db.notifications.values()) if (row.user_id === user.user_id && row.is_read === 0) {
    row.is_read = 1; row.updated_at = nowString(); updated_count++;
  }
  return ok({ updated_count });
}
function remove(req: MockRequest) { const row = owned(req); db.notifications.delete(row.id); return ok(); }
function registerToken(req: MockRequest) {
  const { user } = notificationAuth(req); const body = readBody(req);
  if (body.fcm_token === undefined || body.fcm_token === null || body.fcm_token === '') reject('9101');
  if (typeof body.fcm_token !== 'string') reject('2002');
  if (!body.fcm_token.trim()) reject('9101');
  if (body.device_type === undefined || body.device_type === null || body.device_type === '') reject('2001');
  if (typeof body.device_type !== 'string') reject('2002');
  const device = body.device_type.toLowerCase();
  if (device !== 'android' && device !== 'ios' && device !== 'web') reject('2003');
  const existing = [...db.user_fcm_tokens.values()].find((row) => row.fcm_token === body.fcm_token);
  const now = nowString();
  const row: DeviceTokenRow = { id: existing?.id ?? nextId(db.user_fcm_tokens), user_id: user.user_id, fcm_token: body.fcm_token, device_type: device, created_at: existing?.created_at ?? now, updated_at: now };
  db.user_fcm_tokens.set(row.id, row);
  return ok(row);
}
export const notificationRoutes: RouteDef[] = [
  ['POST', '/notifications/register_token', registerToken],
  ['GET', '/notifications', list],
  ['PUT', '/notifications/read-all', readAll],
  ['PUT', '/notifications/:id', read],
  ['DELETE', '/notifications/:id', remove],
];
