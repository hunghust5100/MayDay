import type { MedicalRecordStatus, Tone } from '@/shared/types';

/** Nhãn tiếng Việt và màu của từng trạng thái bệnh án. */
export const MEDICAL_RECORD_STATUS: Record<MedicalRecordStatus, { label: string; tone: Tone }> = {
  pending: { label: 'Chờ tiếp nhận', tone: 'warning' },
  in_progress: { label: 'Đang khám', tone: 'info' },
  completed: { label: 'Hoàn thành', tone: 'success' },
  cancelled: { label: 'Đã hủy', tone: 'neutral' },
};
