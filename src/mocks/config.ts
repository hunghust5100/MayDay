/** Development scenarios only. Restart/reload the app after changing seed flags. */
export const MODULE_MOCK_SCENARIOS = {
  emptyNotifications: false,
  emptyTemplates: false,
  /** Fail the next N list requests to exercise ErrorState/retry, without changing REST contracts. */
  listFailures: { notifications: 0, templates: 0 },
};

/** Cấu hình mock API — chỉnh tại đây khi cần thử các tình huống khác. */
export const MOCK_CONFIG = {
  /** Độ trễ giả lập mỗi request (ms): ngẫu nhiên trong khoảng [min, max]. */
  latency: { min: 250, max: 650 },
  /** Thời hạn JWT giả (giây). Đặt nhỏ (VD 30) để thử luồng `3002 Token expired`. */
  tokenTtlSeconds: 7 * 24 * 60 * 60,
  /** OTP quên mật khẩu luôn là mã này (server thật gửi SMS mã ngẫu nhiên). */
  otp: '123456',
  /** Thời hạn OTP (phút) — theo tài liệu là 10 phút. */
  otpTtlMinutes: 10,
  /** Mật khẩu của mọi tài khoản mẫu. */
  seedPassword: '123456',
  /** In từng request ra console. */
  log: true,
} as const;

/**
 * ID vai trò trong dữ liệu mẫu. Tài liệu chỉ chốt `3` = Bệnh nhân;
 * các ID còn lại là giả định của mock — cần đối chiếu với seed của backend.
 */
export const ROLE = {
  ADMIN: 1,
  DOCTOR: 2,
  PATIENT: 3,
  NURSE: 4,
  DIRECTOR: 5,
  HEAD_OF_DEPARTMENT: 6,
  INTERN_DOCTOR: 7,
} as const;
