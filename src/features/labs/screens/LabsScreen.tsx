import { ComingSoonScreen } from '@/shared/ui';

/** Xét nghiệm — dùng cho cả bệnh nhân và bác sĩ. Màn giữ chỗ — thay bằng màn thật. */
export function LabsScreen() {
  return (
    <ComingSoonScreen
      title="Xét nghiệm"
      module="features/labs"
      description="Chỉ định xét nghiệm và xem kết quả cận lâm sàng."
    />
  );
}
