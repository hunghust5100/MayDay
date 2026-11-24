import type { LucideIcon } from 'lucide-react-native';
import type { ReactElement } from 'react';
import { FlatList, RefreshControl, View, type FlatListProps } from 'react-native';

import { colors } from '@/shared/theme';
import { cn } from '@/shared/utils';

import { Spinner } from '../spinner/Spinner';
import { EmptyState, ErrorState } from '../states/EmptyState';

export type PaginatedListProps<T> = Omit<
  FlatListProps<T>,
  'data' | 'refreshing' | 'onRefresh' | 'onEndReached' | 'ListEmptyComponent' | 'ListFooterComponent'
> & {
  data: readonly T[] | undefined;
  /** Lần tải đầu (chưa có dữ liệu). */
  isLoading?: boolean;
  isError?: boolean;
  /** Bấm "Thử lại" ở trạng thái lỗi. */
  onRetry?: () => void;
  errorDescription?: string;
  /** Lỗi tải trang sau: giữ dữ liệu và chỉ thử lại khi người dùng yêu cầu. */
  isNextPageError?: boolean;
  onRetryNextPage?: () => void;
  /** Kéo xuống để làm mới. */
  onRefresh?: () => void;
  isRefreshing?: boolean;
  /** Còn trang sau. */
  hasNextPage?: boolean;
  isFetchingNextPage?: boolean;
  fetchNextPage?: () => void;
  /** Khung chờ cho lần tải đầu (VD vài Skeleton thẻ). Mặc định là Spinner. */
  loadingComponent?: ReactElement;
  emptyTitle?: string;
  emptyDescription?: string;
  emptyIcon?: LucideIcon;
  /** Lề ngang theo chiều rộng màn hình (mặc định có). */
  padded?: boolean;
  /** Khoảng cách giữa các item (có thể thay bằng class gap riêng). */
  gapClassName?: string;
};

/**
 * Danh sách phân trang: kéo để làm mới, cuộn tới cuối tự tải trang sau,
 * có sẵn trạng thái đang tải / rỗng / lỗi. Dùng cùng `usePaginatedQuery` ở core/api.
 */
export function PaginatedList<T>({
  data,
  isLoading,
  isError,
  onRetry,
  errorDescription,
  isNextPageError = false,
  onRetryNextPage,
  onRefresh,
  isRefreshing = false,
  hasNextPage,
  isFetchingNextPage,
  fetchNextPage,
  loadingComponent,
  emptyTitle = 'Chưa có dữ liệu',
  emptyDescription,
  emptyIcon,
  padded = true,
  gapClassName = 'gap-2 roomy:gap-3',
  contentContainerClassName,
  ...props
}: PaginatedListProps<T> & { contentContainerClassName?: string }) {
  const isEmpty = !data || data.length === 0;

  let emptyComponent: ReactElement;
  if (isLoading) emptyComponent = loadingComponent ?? <Spinner fill className="py-16" />;
  else if (isError) emptyComponent = <ErrorState fill description={errorDescription} onRetry={onRetry} />;
  else emptyComponent = <EmptyState fill title={emptyTitle} description={emptyDescription} icon={emptyIcon} />;

  return (
    <FlatList
      data={data}
      contentContainerClassName={cn('grow pb-4 roomy:pb-6', padded && 'px-3 roomy:px-5', !isEmpty && gapClassName, contentContainerClassName)}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
      onEndReachedThreshold={0.4}
      onEndReached={() => {
        if (hasNextPage && !isFetchingNextPage && !isLoading && !isNextPageError) fetchNextPage?.();
      }}
      refreshControl={
        onRefresh ? (
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary.DEFAULT}
            colors={[colors.primary.DEFAULT]}
          />
        ) : undefined
      }
      ListEmptyComponent={emptyComponent}
      ListFooterComponent={
        isNextPageError ? (
          <ErrorState title="Chưa tải được trang tiếp theo" description={errorDescription} onRetry={onRetryNextPage} />
        ) : isFetchingNextPage ? (
          <View className="py-4">
            <Spinner size="small" />
          </View>
        ) : undefined
      }
      {...props}
    />
  );
}
