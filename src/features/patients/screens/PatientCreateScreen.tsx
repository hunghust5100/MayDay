import { ComingSoonScreen } from '@/shared/ui';

/** Nhân viên y tế — tạo bệnh nhân. Màn giữ chỗ — thay bằng màn thật. */
export function PatientCreateScreen() {
  return (
    <ComingSoonScreen
      title="Thêm bệnh nhân"
      module="features/patients"
      description="Bác sĩ tạo hồ sơ bệnh nhân mới tại quầy."
    />
  );
}
