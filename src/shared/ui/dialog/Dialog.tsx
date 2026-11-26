import type { LucideIcon } from 'lucide-react-native';
import type { ReactNode } from 'react';
import { KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { shadowStyle } from '@/shared/theme';

import { Button } from '../button/Button';
import { Icon } from '../icon/Icon';
import { Text } from '../text/Text';

export type DialogProps = {
  visible: boolean;
  /** Gọi khi bấm nền mờ hoặc nút Back (Android). */
  onClose: () => void;
  title: string;
  description?: string;
  icon?: LucideIcon;
  /** Icon màu đỏ cho thao tác nguy hiểm. */
  destructive?: boolean;
  children?: ReactNode;
  /** Vùng nút bấm dưới cùng. */
  actions?: ReactNode;
};

/** Hộp thoại giữa màn hình. */
export function Dialog({
  visible,
  onClose,
  title,
  description,
  icon,
  destructive,
  children,
  actions,
}: DialogProps) {
  const insets = useSafeAreaInsets();
  return (
    <Modal visible={visible} transparent animationType="fade" statusBarTranslucent onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        className="flex-1 items-center justify-center px-3 roomy:px-4"
        style={{
          paddingTop: insets.top + 8,
          paddingBottom: insets.bottom + 8,
          paddingLeft: insets.left ? insets.left + 12 : undefined,
          paddingRight: insets.right ? insets.right + 12 : undefined,
        }}
      >
        <Pressable
          accessibilityLabel="Đóng hộp thoại"
          onPress={onClose}
          className="absolute inset-0 bg-text/50"
        />
        <View accessibilityViewIsModal className="w-full max-w-[384px] shrink" style={{ maxHeight: '100%' }}>
          <ScrollView
            keyboardShouldPersistTaps="handled"
            className="grow-0 rounded-sheet bg-surface"
            contentContainerClassName="p-3 roomy:p-5"
            style={shadowStyle.overlay}
          >
            {icon && (
              <View
                className={`mb-4 h-14 w-14 items-center justify-center self-center rounded-full ${destructive ? 'bg-danger-soft' : 'bg-primary-soft'}`}
              >
                <Icon as={icon} size={26} color={destructive ? 'danger' : 'primary'} />
              </View>
            )}
            <Text variant="h2" align="center" accessibilityRole="header">
              {title}
            </Text>
            {description && (
              <Text tone="muted" align="center" className="mt-2">
                {description}
              </Text>
            )}
            {children && <View className="mt-4">{children}</View>}
            {actions && <View className="mt-3 gap-2 roomy:mt-6 roomy:gap-2.5">{actions}</View>}
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

export type ConfirmDialogProps = Omit<DialogProps, 'actions' | 'children' | 'onClose'> & {
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
  /** Đang xử lý: nút xác nhận hiện vòng xoay, nút hủy bị khóa. */
  loading?: boolean;
};

/** Hộp xác nhận trước thao tác quan trọng (xóa, hủy bệnh án...). */
export function ConfirmDialog({
  confirmLabel = 'Xác nhận',
  cancelLabel = 'Hủy',
  onConfirm,
  onCancel,
  loading = false,
  destructive,
  ...props
}: ConfirmDialogProps) {
  return (
    <Dialog
      {...props}
      destructive={destructive}
      onClose={loading ? () => {} : onCancel}
      actions={
        <>
          <Button
            title={confirmLabel}
            variant={destructive ? 'danger' : 'primary'}
            fullWidth
            loading={loading}
            onPress={onConfirm}
          />
          <Button title={cancelLabel} variant="ghost" fullWidth disabled={loading} onPress={onCancel} />
        </>
      }
    />
  );
}
