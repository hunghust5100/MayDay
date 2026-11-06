// Public API: hàm tiện ích thuần (format, validate...)
export { cn, tv, type VariantProps } from './cn';
export {
  addDays,
  ageFromYear,
  formatDate,
  formatDateTime,
  formatDayLabel,
  formatRelative,
  formatTime,
  isSameDay,
  parseApiDate,
  startOfDay,
  toApiDate,
  toApiDateTime,
  weekdayShort,
} from './date';
export { formatPhone, isValidPhone, normalizePhone, VN_PHONE_REGEX } from './phone';
export { formatFileSize, getInitials, hashString, removeDiacritics, shortName } from './text';
