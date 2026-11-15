// Public API: hàm tiện ích thuần (format, validate...)
export {
  canFill,
  isRequired,
  ordered,
  questionVisible,
  serializeAnswers,
  SUPPORTED_QUESTION_TYPES,
  validateForm,
} from './clinical-form';
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
export {
  FACILITY_PHONE_REGEX,
  formatPhone,
  isValidFacilityPhone,
  isValidPhone,
  normalizePhone,
  VN_PHONE_REGEX,
} from './phone';
export { formatFileSize, getInitials, hashString, removeDiacritics, shortName } from './text';
