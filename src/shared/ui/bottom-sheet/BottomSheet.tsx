import { X } from 'lucide-react-native';
import type { ReactNode } from 'react';
import { KeyboardAvoidingView, Modal, Platform, Pressable, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { IconButton } from '../icon-button/IconButton';
import { Text } from '../text/Text';

export type BottomSheetProps = {
  visible: boolean;
  /** Gọi khi bấm nền mờ, nút đóng hoặc nút Back (Android). */
  onClose: () => void;
  title?: string;
  /** Giữ chiều cao, kể cả khi lọc danh sách còn ít kết quả. */
  fixedHeight?: boolean;
  children: ReactNode;
  /** Các nút luôn nằm dưới vùng cuộn. */
  footer?: ReactNode;
};

/**
 * Khung bật từ dưới lên — dùng cho chọn từ danh sách, menu hành động. Cao tối đa 85% màn hình;
 * nội dung dài đặt trong ScrollView có class `shrink` để cuộn thay vì tràn.
 */
export function BottomSheet({ visible, onClose, title, children, fixedHeight = false, footer }: BottomSheetProps) {
  const insets = useSafeAreaInsets();

  return (
    <Modal visible={visible} transparent animationType="fade" statusBarTranslucent onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        className="flex-1 justify-end"
        style={{ paddingLeft: insets.left, paddingRight: insets.right }}
      >
        <Pressable accessible={false} onPress={onClose} className="absolute inset-0 bg-text/50" />
        <View
          accessibilityViewIsModal
          className="w-full self-center rounded-t-sheet bg-surface px-3 pt-3 roomy:px-5 roomy:pt-4"
          style={{
            height: fixedHeight ? '72%' : undefined,
            maxHeight: '85%',
            maxWidth: 520,
            paddingBottom: Math.max(insets.bottom, 12),
          }}
        >
          {title && (
            <View className="mb-2 flex-row items-center justify-between">
              <Text variant="h2" accessibilityRole="header" className="flex-1">
                {title}
              </Text>
              <IconButton icon={X} variant="ghost" accessibilityLabel="Đóng" onPress={onClose} />
            </View>
          )}
          <View className={fixedHeight ? 'min-h-0 flex-1' : 'min-h-0 shrink'}>{children}</View>
          {footer && <View className="border-t border-border pt-2">{footer}</View>}
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}
