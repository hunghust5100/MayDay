import { ComingSoonScreen } from '@/shared/ui';

/** Bệnh nhân — tab "Bệnh án". Màn giữ chỗ — thay bằng màn thật. */
export function PatientRecordsScreen() {
  return (
    <ComingSoonScreen
      tab
      title="Bệnh án"
      module="features/medical-records"
      description="Danh sách bệnh án của bệnh nhân, trạng thái khám, kết quả và chỉ định."
    />
  );
}
