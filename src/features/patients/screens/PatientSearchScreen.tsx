import { ComingSoonScreen } from '@/shared/ui';

/** Nhân viên y tế — tab "Bệnh nhân". Màn giữ chỗ — thay bằng màn thật. */
export function PatientSearchScreen() {
  return (
    <ComingSoonScreen
      tab
      title="Bệnh nhân"
      module="features/patients"
      description="Tìm bệnh nhân theo tên, số điện thoại; xem hồ sơ và bệnh án."
    />
  );
}
