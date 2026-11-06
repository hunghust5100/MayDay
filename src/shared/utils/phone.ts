/** SĐT Việt Nam: 10 số, đầu 03/05/07/08/09 (mã lỗi API 2004). */
export const VN_PHONE_REGEX = /^0[35789]\d{8}$/;

/** Bỏ khoảng trắng/dấu chấm/gạch, đổi `+84`/`84` thành `0`. */
export function normalizePhone(value: string): string {
  const digits = value.replace(/[^\d+]/g, '');
  if (digits.startsWith('+84')) return `0${digits.slice(3)}`;
  if (digits.startsWith('84') && digits.length === 11) return `0${digits.slice(2)}`;
  return digits.replace(/\+/g, '');
}

export function isValidPhone(value: string): boolean {
  return VN_PHONE_REGEX.test(normalizePhone(value));
}

/** `0912345678` → `0912 345 678`. */
export function formatPhone(value: string | null | undefined): string {
  if (!value) return '';
  const phone = normalizePhone(value);
  return phone.length === 10 ? `${phone.slice(0, 4)} ${phone.slice(4, 7)} ${phone.slice(7)}` : phone;
}
