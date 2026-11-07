/**
 * Design token — Phương án A "Xanh ngọc tối giản" (chế độ sáng).
 * Nguồn duy nhất cho tailwind.config.js và code TS (qua src/shared/theme/index.ts).
 * Component chỉ dùng tên theo ý nghĩa (bg-surface, text-muted...), không dùng màu thô.
 */
const colors = {
  bg: '#F6F8FA',
  surface: '#FFFFFF',
  'surface-2': '#F1F5F9',
  text: '#0F172A',
  muted: '#64748B',
  subtle: '#94A3B8',
  border: '#E2E8F0',

  primary: { DEFAULT: '#0D9488', strong: '#0F766E', soft: '#CCFBF1' },
  'on-primary': '#FFFFFF',

  success: { DEFAULT: '#22C55E', strong: '#15803D', soft: '#DCFCE7' },
  warning: { DEFAULT: '#F59E0B', strong: '#B45309', soft: '#FEF3C7' },
  danger: { DEFAULT: '#EF4444', strong: '#B91C1C', soft: '#FEE2E2' },
  info: { DEFAULT: '#3B82F6', strong: '#1D4ED8', soft: '#DBEAFE' },
  neutral: { DEFAULT: '#64748B', strong: '#475569', soft: '#F1F5F9' },

  // Thang mức độ 0–3 (UAS7, triệu chứng)
  severity: { 0: '#22C55E', 1: '#84CC16', 2: '#F59E0B', 3: '#EF4444' },

  // Ô màu truy cập nhanh
  tile: {
    teal: '#CCFBF1', 'teal-fg': '#0F766E',
    indigo: '#E0E7FF', 'indigo-fg': '#4338CA',
    rose: '#FFE4E6', 'rose-fg': '#BE123C',
    amber: '#FEF3C7', 'amber-fg': '#B45309',
  },
};

const radius = { input: 14, btn: 14, card: 16, tile: 18, sheet: 24 };

/** Tên font đã nạp từ @expo-google-fonts/be-vietnam-pro, theo độ đậm. */
const fonts = {
  regular: 'BeVietnamPro_400Regular',
  medium: 'BeVietnamPro_500Medium',
  semibold: 'BeVietnamPro_600SemiBold',
  bold: 'BeVietnamPro_700Bold',
  extrabold: 'BeVietnamPro_800ExtraBold',
};

/** Cỡ chữ [fontSize, lineHeight] (px) — giữ tên chuẩn của Tailwind để tailwind-merge nhận diện. */
const fontSize = {
  xs: [12, 16],
  sm: [13, 18],
  base: [15, 22],
  md: [16, 24],
  lg: [18, 26],
  xl: [20, 28],
  '2xl': [26, 32],
  '3xl': [32, 40],
};

/** Đổ bóng (CSS box-shadow, React Native ≥ 0.76 hỗ trợ cả iOS/Android/web). */
const shadows = {
  card: '0px 1px 2px rgba(15,23,42,0.05), 0px 1px 3px rgba(15,23,42,0.06)',
  primary: '0px 8px 18px -8px rgba(13,148,136,1)',
  /** Thẻ nổi trên nền (VD thẻ form đè lên header). */
  raised: '0px 16px 36px -14px rgba(15,23,42,0.20), 0px 2px 6px rgba(15,23,42,0.04)',
  overlay: '0px 12px 32px -8px rgba(15,23,42,0.25)',
};

module.exports = { colors, radius, fonts, fontSize, shadows };
