import { colors } from '@/shared/theme';
import type { SeverityLevel } from '@/shared/types';

/** Nhãn và màu của thang mức độ 0–3, từ xanh lá (nhẹ) tới đỏ (nặng). */
export const SEVERITY_LEVELS: Record<SeverityLevel, { label: string; color: string }> = {
  0: { label: 'Không', color: colors.severity[0] },
  1: { label: 'Nhẹ', color: colors.severity[1] },
  2: { label: 'Trung bình', color: colors.severity[2] },
  3: { label: 'Nặng', color: colors.severity[3] },
};

/**
 * Màu theo mức độ cho thang điểm bất kỳ (0–3 của UAS7, 0–10 của triệu chứng...):
 * quy đổi tỉ lệ `value / max` về 4 mức màu của thang 0–3.
 */
export function getSeverityColor(value: number, max = 3): string {
  const ratio = max > 0 ? Math.min(Math.max(value / max, 0), 1) : 0;
  const level = Math.round(ratio * 3) as SeverityLevel;
  return SEVERITY_LEVELS[level].color;
}
