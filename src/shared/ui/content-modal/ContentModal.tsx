import { X } from 'lucide-react-native';
import type { ReactNode } from 'react';
import { KeyboardAvoidingView, Modal, Platform, Pressable, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { shadowStyle } from '@/shared/theme';

import { IconButton } from '../icon-button/IconButton';
import { Text } from '../text/Text';

export type ContentModalProps = {
  visible: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
};

/** Opt-in centered overlay with no motion. Scrollable content belongs to the caller. */
export function ContentModal({ visible, onClose, title, children }: ContentModalProps) {
  const insets = useSafeAreaInsets();
  return (
    <Modal visible={visible} transparent animationType="none" statusBarTranslucent onRequestClose={onClose}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} className="flex-1">
        <View
          className="flex-1 items-center justify-center px-3 roomy:px-5"
          style={{
            paddingTop: Math.max(insets.top, 12),
            paddingBottom: Math.max(insets.bottom, 12),
            paddingLeft: insets.left ? insets.left + 12 : undefined,
            paddingRight: insets.right ? insets.right + 12 : undefined,
          }}>
          <Pressable accessibilityLabel="Đóng" onPress={onClose} className="absolute inset-0 bg-text/50" />
          <View testID="content-modal-panel" accessibilityViewIsModal className="w-full shrink rounded-card bg-surface p-3 roomy:p-5" style={[{ maxWidth: 480, maxHeight: '85%' }, shadowStyle.overlay]}>
            <View className="mb-2 flex-row items-center gap-2">
              <Text variant="h2" accessibilityRole="header" className="flex-1">{title}</Text>
              <IconButton icon={X} variant="ghost" accessibilityLabel="Đóng" onPress={onClose} />
            </View>
            <View className="shrink">{children}</View>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}
