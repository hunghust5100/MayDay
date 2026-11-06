/**
 * Ngày giờ theo quy ước API (giờ địa phương, không kèm múi giờ):
 * - Thời điểm: `YYYY-MM-DD HH:mm:ss`
 * - Ngày:      `YYYY-MM-DD`
 */

const pad = (n: number) => String(n).padStart(2, '0');

const WEEKDAYS_SHORT = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
const WEEKDAYS_LONG = ['Chủ nhật', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7'];

/** Chuỗi ngày/thời điểm của API → Date (giờ địa phương). Sai định dạng → null. */
export function parseApiDate(value: string | null | undefined): Date | null {
  if (!value) return null;
  const match = /^(\d{4})-(\d{2})-(\d{2})(?:[ T](\d{2}):(\d{2})(?::(\d{2}))?)?/.exec(value);
  if (!match) return null;
  const [, y, m, d, hh = '0', mm = '0', ss = '0'] = match;
  const date = new Date(+y, +m - 1, +d, +hh, +mm, +ss);
  return Number.isNaN(date.getTime()) ? null : date;
}

/** Date → `YYYY-MM-DD`. */
export function toApiDate(date: Date): string {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

/** Date → `YYYY-MM-DD HH:mm:ss`. */
export function toApiDateTime(date: Date): string {
  return `${toApiDate(date)} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
}

type DateInput = Date | string | null | undefined;

function toDate(value: DateInput): Date | null {
  return value instanceof Date ? value : parseApiDate(value);
}

/** `06/11/2026` */
export function formatDate(value: DateInput, fallback = '—'): string {
  const date = toDate(value);
  return date ? `${pad(date.getDate())}/${pad(date.getMonth() + 1)}/${date.getFullYear()}` : fallback;
}

/** `08:30` */
export function formatTime(value: DateInput, fallback = '—'): string {
  const date = toDate(value);
  return date ? `${pad(date.getHours())}:${pad(date.getMinutes())}` : fallback;
}

/** `08:30 · 06/11/2026` */
export function formatDateTime(value: DateInput, fallback = '—'): string {
  const date = toDate(value);
  return date ? `${formatTime(date)} · ${formatDate(date)}` : fallback;
}

/** `Thứ 5, 06/11` — `short`: `T5, 06/11`. */
export function formatDayLabel(value: DateInput, { short = false } = {}, fallback = '—'): string {
  const date = toDate(value);
  if (!date) return fallback;
  const weekday = (short ? WEEKDAYS_SHORT : WEEKDAYS_LONG)[date.getDay()];
  return `${weekday}, ${pad(date.getDate())}/${pad(date.getMonth() + 1)}`;
}

/** Thứ viết tắt: `T2`…`T7`, `CN`. */
export function weekdayShort(value: DateInput): string {
  const date = toDate(value);
  return date ? WEEKDAYS_SHORT[date.getDay()] : '';
}

export function isSameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

/** Cộng/trừ số ngày, trả Date mới. */
export function addDays(date: Date, days: number): Date {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

/** Đầu ngày (00:00:00). */
export function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

/** Thời gian tương đối: `Vừa xong`, `5 phút trước`, `2 giờ trước`, `Hôm qua`, `3 ngày trước`, rồi tới ngày cụ thể. */
export function formatRelative(value: DateInput, now: Date = new Date(), fallback = '—'): string {
  const date = toDate(value);
  if (!date) return fallback;
  const diffMinutes = Math.floor((now.getTime() - date.getTime()) / 60000);
  if (diffMinutes < 1) return 'Vừa xong';
  if (diffMinutes < 60) return `${diffMinutes} phút trước`;
  const days = Math.round((startOfDay(now).getTime() - startOfDay(date).getTime()) / 86400000);
  if (days === 0) return `${Math.floor(diffMinutes / 60)} giờ trước`;
  if (days === 1) return 'Hôm qua';
  if (days < 7) return `${days} ngày trước`;
  return formatDate(date);
}

/** Tuổi tính theo năm sinh. */
export function ageFromYear(yearOfBirth: number | null | undefined, now: Date = new Date()): number | null {
  return yearOfBirth ? now.getFullYear() - yearOfBirth : null;
}
