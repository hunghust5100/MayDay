// Public API: design token: màu, bo góc, font, cỡ chữ, đổ bóng
import { colors, fontSize, fonts, radius, shadows } from './tokens';

export { colors, fontSize, fonts, radius, shadows };

/** Style đổ bóng dùng trực tiếp cho prop `style` (không có class Tailwind tương đương trên native). */
export const shadowStyle = {
  card: { boxShadow: shadows.card },
  primary: { boxShadow: shadows.primary },
  overlay: { boxShadow: shadows.overlay },
} as const;
