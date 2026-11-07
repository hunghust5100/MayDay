import { ComingSoonScreen } from '@/shared/ui';

/** Kho ảnh — dùng cho cả bệnh nhân và bác sĩ. Màn giữ chỗ — thay bằng màn thật. */
export function MediaScreen() {
  return (
    <ComingSoonScreen
      title="Kho ảnh"
      module="features/media"
      description="Ảnh đã tải lên, gắn ảnh vào câu trả lời của bệnh án."
    />
  );
}
