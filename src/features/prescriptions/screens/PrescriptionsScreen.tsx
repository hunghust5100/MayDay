import { ComingSoonScreen } from '@/shared/ui';

/** Đơn thuốc — dùng cho cả bệnh nhân và bác sĩ. Màn giữ chỗ — thay bằng màn thật. */
export function PrescriptionsScreen() {
  return (
    <ComingSoonScreen
      title="Đơn thuốc"
      module="features/prescriptions"
      description="Xem đơn thuốc (bệnh nhân) hoặc kê đơn theo bệnh án (bác sĩ)."
    />
  );
}
