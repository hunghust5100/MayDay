import { z } from 'zod';

import { isValidPhone } from '@/shared/utils';

/**
 * Bộ quy tắc kiểm tra dùng chung, thông báo tiếng Việt, khớp ràng buộc của API
 * (SĐT VN 2004, mật khẩu ≥ 6 ký tự, ngày `YYYY-MM-DD` 2006...).
 */
export const rules = {
  /** Chuỗi bắt buộc, đã trim. */
  required: (label: string) => z.string().trim().min(1, `Vui lòng nhập ${label}`),

  /** Chuỗi không bắt buộc; chuỗi rỗng → undefined. */
  optional: () =>
    z
      .string()
      .trim()
      .transform((value) => value || undefined)
      .optional(),

  /** SĐT Việt Nam 10 số, đầu 03/05/07/08/09. */
  phone: () =>
    z
      .string()
      .trim()
      .min(1, 'Vui lòng nhập số điện thoại')
      .refine(isValidPhone, 'Số điện thoại không hợp lệ (10 số, đầu 03/05/07/08/09)'),

  /** Mật khẩu tối thiểu 6 ký tự. */
  password: (label = 'mật khẩu') =>
    z.string().min(1, `Vui lòng nhập ${label}`).min(6, 'Mật khẩu tối thiểu 6 ký tự'),

  /** Mã OTP gồm `length` chữ số. */
  otp: (length = 6) => z.string().regex(new RegExp(`^\\d{${length}}$`), `Mã OTP gồm ${length} chữ số`),

  email: () => z.string().trim().email('Email không hợp lệ'),

  /** Ngày theo định dạng API `YYYY-MM-DD`. */
  date: (label = 'ngày') =>
    z
      .string({ error: `Vui lòng chọn ${label}` })
      .regex(/^\d{4}-\d{2}-\d{2}$/, `Vui lòng chọn ${label}`),

  /** Năm sinh 1900 → năm hiện tại. */
  yearOfBirth: () =>
    z
      .number({ error: 'Vui lòng nhập năm sinh' })
      .int('Năm sinh không hợp lệ')
      .min(1900, 'Năm sinh không hợp lệ')
      .max(new Date().getFullYear(), 'Năm sinh không hợp lệ'),

  /** Số nguyên trong khoảng — VD điểm 0–3, 0–10. */
  score: (min: number, max: number, label = 'điểm') =>
    z
      .number({ error: `Vui lòng chọn ${label}` })
      .int()
      .min(min, `${label} từ ${min} đến ${max}`)
      .max(max, `${label} từ ${min} đến ${max}`),

  /** Bắt buộc chọn (select/radio). */
  choice: <T extends readonly [string, ...string[]]>(values: T, label: string) =>
    z.enum(values, { error: `Vui lòng chọn ${label}` }),
};

/** Kiểm tra "nhập lại mật khẩu" khớp — dùng trong `.superRefine` / `.refine` của object schema. */
export function passwordsMatch<T extends { password: string; confirm_password: string }>(data: T) {
  return data.password === data.confirm_password;
}
