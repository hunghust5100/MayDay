import { createContext, useContext, type ReactNode } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, View, type ScrollViewProps } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { cn } from '@/shared/utils';

export const ScreenNoticeContext = createContext<ReactNode>(null);
export const ScreenAboveTabBarContext = createContext(false);

export type ScreenProps = {
  children: ReactNode;
  /** Nội dung cuộn được (mặc định có). Danh sách dùng FlatList thì đặt `false`. */
  scroll?: boolean;
  /** Lề ngang theo chiều rộng màn hình (mặc định có). */
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
  const notice = useContext(ScreenNoticeContext);
  const aboveTabBar = useContext(ScreenAboveTabBarContext);
  const bottomInset = aboveTabBar ? 0 : insets.bottom;
  const padX = padded ? 'px-3 roomy:px-5' : '';
  const contentWidth = Platform.OS === 'web' ? 'w-full max-w-[1100px] self-center' : '';

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      className={cn('flex-1 bg-bg', className)}
      style={{ paddingTop: safeTop ? insets.top : 0, paddingLeft: insets.left, paddingRight: insets.right }}>
      {notice}
      {header && <View className={cn(padX, contentWidth)}>{header}</View>}
      {scroll ? (
        <ScrollView
          className="flex-1"
          contentContainerClassName={cn('grow pb-4 roomy:pb-6', padX, contentWidth, contentClassName)}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          refreshControl={refreshControl}>
          {children}
        </ScrollView>
      ) : (
        <View className={cn('flex-1', padX, contentWidth, contentClassName)}>{children}</View>
      )}
      {footer ? (
        <View
          className={cn('border-t border-border bg-surface pt-2 roomy:pt-3', padX)}
          style={{ paddingBottom: Math.max(bottomInset, 12) }}>
          <View className={contentWidth}>{footer}</View>
        </View>
      ) : bottomInset > 0 && <View style={{ height: bottomInset }} />}
    </KeyboardAvoidingView>
  );
}
