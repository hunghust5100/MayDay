import { ComingSoonScreen } from '@/shared/ui';

/** Admin — quản lý Chi nhánh → Khoa → Phòng khám (tab "Cơ sở"). */
export function FacilitiesScreen() {
  return (
    <ComingSoonScreen
      tab
      title="Cơ sở"
      module="features/facilities"
      description="Quản lý chi nhánh, khoa và phòng khám: thêm, sửa, xóa theo tài liệu CSVC."
    />
  );
}
