import { useInfiniteQuery, type QueryKey } from '@tanstack/react-query';
import { useMemo } from 'react';

import { env } from '@/core/config';

import type { Page } from './client';

export type PageParams = { page: number; limit: number; signal: AbortSignal };

export type UsePaginatedQueryOptions<T, TMeta extends object = object> = {
  queryKey: QueryKey;
  /** Hàm gọi API của feature, nhận `page`/`limit`, trả `{ items, total, ...metadata }`. */
  queryFn: (params: PageParams) => Promise<Page<T, TMeta>>;
  limit?: number;
  enabled?: boolean;
  /** Opt in to detailed errors/manual next-page retry without changing existing screens. */
  pageErrorFeedback?: boolean;
};

/**
 * Phân trang `page`/`limit`/`total` với react-query; trả kèm `listProps` để trải thẳng vào `PaginatedList`:
 *
 * ```tsx
 * const { listProps } = usePaginatedQuery({ queryKey: ['patients', keyword], queryFn: (p) => getPatients({ ...p, keyword }) });
 * <PaginatedList {...listProps} renderItem={...} />
 * ```
 */
export function usePaginatedQuery<T, TMeta extends object = object>({
  queryKey,
  queryFn,
  limit = env.pageSize,
  enabled = true,
  pageErrorFeedback = false,
}: UsePaginatedQueryOptions<T, TMeta>) {
  const query = useInfiniteQuery({
    queryKey: [...queryKey, { limit }],
    initialPageParam: 1,
    queryFn: ({ pageParam, signal }) => queryFn({ page: pageParam, limit, signal }),
    getNextPageParam: (lastPage, pages) => {
      const loaded = pages.reduce((sum, page) => sum + page.items.length, 0);
      return loaded < lastPage.total && lastPage.items.length > 0 ? pages.length + 1 : undefined;
    },
    enabled,
  });

  const items = useMemo(() => query.data?.pages.flatMap((page) => page.items) ?? [], [query.data]);

  return {
    ...query,
    items,
    total: query.data?.pages[0]?.total ?? 0,
    /** Trang đầu tiên, dùng cho metadata ngoài `data` như `unread_count`. */
    firstPage: query.data?.pages[0],
    listProps: {
      data: items,
      isLoading: query.isLoading,
      isError: query.isError && items.length === 0,
      ...(pageErrorFeedback ? {
        errorDescription: query.error instanceof Error ? query.error.message : undefined,
        isNextPageError: query.isFetchNextPageError,
        onRetryNextPage: () => query.fetchNextPage(),
      } : {}),
      onRetry: () => query.refetch(),
      onRefresh: () => query.refetch(),
      isRefreshing: query.isRefetching && !query.isFetchingNextPage,
      hasNextPage: query.hasNextPage,
      isFetchingNextPage: query.isFetchingNextPage,
      fetchNextPage: () => query.fetchNextPage(),
    },
  };
}
