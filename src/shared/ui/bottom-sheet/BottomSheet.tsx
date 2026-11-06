import { X } from 'lucide-react-native';
import type { ReactNode } from 'react';
import { Modal, Pressable, View } from 'react-native';
import Animated, { SlideInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { IconButton } from '../icon-button/IconButton';
import { Text } from '../text/Text';

export type BottomSheetProps = {
  visible: boolean;
  /** Gọi khi bấm nền mờ, nút đóng hoặc nút Back (Android). */
  onClose: () => void;
  title?: string;
  children: ReactNode;
};

/**
 * Khung bật từ dưới lên — dùng cho chọn từ danh sách, menu hành động. Cao tối đa 85% màn hình;
 * nội dung dài đặt trong ScrollView có class `shrink` để cuộn thay vì tràn.
 */
export function BottomSheet({ visible, onClose, title, children }: BottomSheetProps) {
  const insets = useSafeAreaInsets();

  return (
    <Modal visible={visible} transparent animationType="fade" statusBarTranslucent onRequestClose={onClose}>
      <View className="flex-1 justify-end">
        <Pressable accessibilityLabel="Đóng" onPress={onClose} className="absolute inset-0 bg-text/50" />
        {/* Animated.View (reanimated) không nhận className — chỉ dùng cho hiệu ứng, style đặt ở View bên trong. */}
        <Animated.View entering={SlideInDown.springify().damping(20)} style={{ maxHeight: '85%' }}>
          {/* shrink: nội dung dài thì co lại trong 85% màn hình, ScrollView con tự cuộn. */}
          <View
            className="shrink rounded-t-sheet bg-surface px-5 pt-2.5"
            style={{ paddingBottom: Math.max(insets.bottom, 16) }}>
            <View className="mb-2 h-1.5 w-10 self-center rounded-full bg-border" />
            {title && (
              <View className="mb-2 flex-row items-center justify-between">
                <Text variant="h2" accessibilityRole="header" className="flex-1">
                  {title}
                </Text>
                <IconButton icon={X} variant="ghost" accessibilityLabel="Đóng" onPress={onClose} />
              </View>
            )}
            {children}
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}
