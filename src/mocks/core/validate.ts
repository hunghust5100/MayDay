import { VN_PHONE_REGEX } from '@/shared/utils';

import { reject, type MockRequest } from './http';

/**
 * Bộ kiểm tra tham số, trả mã lỗi theo quy ước của tài liệu API:
 * thiếu → 2001 · sai kiểu → 2002 · sai giá trị → 2003 · SĐT → 2004 · ngày → 2006 · body hỏng → 2007.
 */

export type Body = Record<string, unknown>;

export const GENDERS = ['male', 'female', 'other'] as const;
export type Gender = (typeof GENDERS)[number];

const isBlank = (value: unknown) =>
  value === undefined || value === null || (typeof value === 'string' && value.trim() === '');

/** Body phải là object JSON. */
export function readBody(req: MockRequest): Body {
  const { body } = req;
  if (typeof body !== 'object' || body === null || Array.isArray(body)) reject('2007');
  return body as Body;
}

export function requireFields(body: Body, keys: readonly string[]) {
  if (keys.some((key) => isBlank(body[key]))) reject('2001');
}

/** Có ít nhất một trường trong `keys` được gửi (dùng cho cập nhật một phần). */
export function requireAny(body: Body, keys: readonly string[]) {
  if (!keys.some((key) => body[key] !== undefined)) reject('2001');
}

/** Chuỗi: không gửi → `undefined`, gửi `null` → `null`, sai kiểu → 2002. */
export function optString(body: Body, key: string): string | null | undefined {
  const value = body[key];
  if (value === undefined || value === null) return value;
  if (typeof value !== 'string') reject('2002');
  return value;
}

export function reqString(body: Body, key: string): string {
  const value = optString(body, key);
  if (value === undefined || value === null) reject('2001');
  return value;
}

/** Số nguyên: không gửi → `undefined`, gửi `null` → `null`, sai kiểu → 2002. */
export function optInt(body: Body, key: string): number | null | undefined {
  const value = body[key];
  if (value === undefined || value === null) return value;
  if (typeof value !== 'number' || !Number.isInteger(value)) reject('2002');
  return value;
}

export function reqInt(body: Body, key: string): number {
  const value = optInt(body, key);
  if (value === undefined || value === null) reject('2001');
  return value;
}

export function checkPhone(phone: string) {
  if (!VN_PHONE_REGEX.test(phone)) reject('2004');
}

export function checkPassword(password: string) {
  if (password.length < 6) reject('2003');
}

export function checkGender(gender: string | null | undefined): asserts gender is Gender | null | undefined {
  if (gender != null && !(GENDERS as readonly string[]).includes(gender)) reject('2003');
}

export function checkFlag(value: number | null | undefined) {
  if (value != null && value !== 0 && value !== 1) reject('2003');
}

export function checkYearOfBirth(year: number | null | undefined) {
  if (year != null && (year < 1900 || year > new Date().getFullYear())) reject('2003');
}

/** Ngày `YYYY-MM-DD` có thật (không nhận 2026-02-30). */
export function checkDate(value: string | null | undefined) {
  if (value == null) return;
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) reject('2006');
  const [, y, m, d] = match.map(Number);
  const date = new Date(y, m - 1, d);
  if (date.getFullYear() !== y || date.getMonth() !== m - 1 || date.getDate() !== d) reject('2006');
}

/** Tham số đường dẫn kiểu int, VD `:id`. */
export function paramInt(req: MockRequest, key: string): number {
  const raw = req.params[key];
  if (!/^\d+$/.test(raw ?? '')) reject('2002');
  return Number(raw);
}

/** Tham số query kiểu int; không gửi → `undefined`. */
export function queryInt(req: MockRequest, key: string): number | undefined {
  const raw = req.query[key];
  if (raw === undefined || raw === '') return undefined;
  if (!/^-?\d+$/.test(raw)) reject('2002');
  return Number(raw);
}

/** `page`/`limit` theo quy ước phân trang (mặc định 1/20, `limit` tối đa 100). */
export function readPaging(req: MockRequest) {
  const page = Math.max(queryInt(req, 'page') ?? 1, 1);
  const limit = Math.min(Math.max(queryInt(req, 'limit') ?? 20, 1), 100);
  return { page, limit, offset: (page - 1) * limit };
}
