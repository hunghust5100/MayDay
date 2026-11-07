import { MOCK_CONFIG, ROLE } from '../config';
import { db, type UserRow } from '../db/store';
import { reject, type MockRequest } from './http';

/**
 * JWT giả: `mock.<user_id>.<token_version>.<exp>.<jti>` — client coi như chuỗi mờ, giống JWT thật.
 * Mang theo `user_id` nên tài khoản mẫu vẫn đăng nhập được sau khi tải lại app (CSDL giả được dựng lại).
 */
export function issueToken(user: UserRow) {
  const exp = Math.floor(Date.now() / 1000) + MOCK_CONFIG.tokenTtlSeconds;
  const jti = Math.random().toString(36).slice(2, 12);
  return `mock.${user.user_id}.${user.token_version}.${exp}.${jti}`;
}

export type AuthContext = { user: UserRow; jti: string };

/**
 * Middleware xác thực: thiếu header → 3003 · token sai/đã blacklist → 3001 · hết hạn → 3002 ·
 * tài khoản bị khóa → 3101.
 */
export function authenticate(req: MockRequest): AuthContext {
  const header = req.headers.authorization;
  if (!header) reject('3003');
  const match = /^Bearer mock\.(\d+)\.(\d+)\.(\d+)\.(\w+)$/.exec(header);
  if (!match) reject('3001');
  const [, userId, version, exp, jti] = match;

  const user = db.users.get(Number(userId));
  if (!user || db.token_blacklist.has(jti) || user.token_version !== Number(version)) reject('3001');
  if (Number(exp) * 1000 < Date.now()) reject('3002');
  if (user.is_active !== 1) reject('3101');
  return { user, jti };
}

export function requireAdmin(req: MockRequest): AuthContext {
  const context = authenticate(req);
  if (context.user.role_id !== ROLE.ADMIN) reject('3102');
  return context;
}

export function requirePatient(req: MockRequest): AuthContext {
  const context = authenticate(req);
  if (context.user.role_id !== ROLE.PATIENT) reject('3104');
  return context;
}
