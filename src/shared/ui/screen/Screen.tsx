import type { ReactNode } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, View, type ScrollViewProps } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { cn } from '@/shared/utils';

export type ScreenProps = {
  children: ReactNode;
  /** Nội dung cuộn được (mặc định có). Danh sách dùng FlatList thì đặt `false`. */
  scroll?: boolean;
  /** Padding ngang 20px (mặc định có). */
  padded?: boolean;
  /** Phần cố định phía trên vùng cuộn (VD AppHeader). */
  header?: ReactNode;
  /** Phần cố định dưới đáy (VD nút hành động chính). */
  footer?: ReactNode;
  /** Bỏ vùng an toàn phía trên khi màn hình đã có header của navigator. */
  safeTop?: boolean;
  className?: string;
  contentClassName?: string;
  refreshControl?: ScrollViewProps['refreshControl'];
};

/** Khung màn hình chuẩn: nền, vùng an toàn, cuộn, tránh bàn phím che ô nhập. */
export function Screen({
  children,
  scroll = true,
  padded = true,
  header,
  footer,
  safeTop = true,
  className,
  contentClassName,
  refreshControl,
}: ScreenProps) {
  const insets = useSafeAreaInsets();
  const padX = padded ? 'px-5' : '';

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      className={cn('flex-1 bg-bg', className)}
      style={{ paddingTop: safeTop ? insets.top : 0 }}>
      {header && <View className={padX}>{header}</View>}
      {scroll ? (
        <ScrollView
          className="flex-1"
          contentContainerClassName={cn('grow pb-6', padX, contentClassName)}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          refreshControl={refreshControl}>
          {children}
        </ScrollView>
      ) : (
        <View className={cn('flex-1', padX, contentClassName)}>{children}</View>
      )}
      {footer ? (
        <View
          className={cn('border-t border-border bg-surface pt-3', padX)}
          style={{ paddingBottom: Math.max(insets.bottom, 12) }}>
          {footer}
        </View>
      ) : (
        <View style={{ height: insets.bottom }} />
      )}
    </KeyboardAvoidingView>
  );
}
