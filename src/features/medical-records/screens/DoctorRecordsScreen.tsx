import { ComingSoonScreen } from '@/shared/ui';

/** Nhân viên y tế — tab "Bệnh án". Màn giữ chỗ — thay bằng màn thật. */
export function DoctorRecordsScreen() {
  return (
    <ComingSoonScreen
      tab
      title="Bệnh án"
      module="features/medical-records"
      description="Danh sách bệnh án theo trạng thái (chờ tiếp nhận, đang khám, hoàn thành), tiếp nhận và chốt bệnh án."
    />
  );
}
