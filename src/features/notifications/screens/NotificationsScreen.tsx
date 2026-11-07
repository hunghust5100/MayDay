import { ComingSoonScreen } from '@/shared/ui';

/** Tab "Thông báo" — mọi vai trò. Màn giữ chỗ — thay bằng màn thật. */
export function NotificationsScreen() {
  return (
    <ComingSoonScreen
      tab
      title="Thông báo"
      module="features/notifications"
      description="Danh sách thông báo đẩy, đánh dấu đã đọc."
    />
  );
}
