import { useInfiniteQuery, type QueryKey } from '@tanstack/react-query';
import { useMemo } from 'react';

import { env } from '@/core/config';

import type { Page } from './client';

export type PageParams = { page: number; limit: number; signal: AbortSignal };

export type UsePaginatedQueryOptions<T> = {
  queryKey: QueryKey;
  /** Hàm gọi API của feature, nhận `page`/`limit`, trả `{ items, total }` (thường dùng `api.getPage`). */
  queryFn: (params: PageParams) => Promise<Page<T>>;
  limit?: number;
  enabled?: boolean;
};

/**
 * Phân trang `page`/`limit`/`total` với react-query; trả kèm `listProps` để trải thẳng vào `PaginatedList`:
 *
 * ```tsx
 * const { listProps } = usePaginatedQuery({ queryKey: ['patients', keyword], queryFn: (p) => getPatients({ ...p, keyword }) });
 * <PaginatedList {...listProps} renderItem={...} />
 * ```
 */
export function usePaginatedQuery<T>({ queryKey, queryFn, limit = env.pageSize, enabled = true }: UsePaginatedQueryOptions<T>) {
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
    listProps: {
      data: items,
      isLoading: query.isLoading,
      isError: query.isError && items.length === 0,
      onRetry: () => query.refetch(),
      onRefresh: () => query.refetch(),
      isRefreshing: query.isRefetching && !query.isFetchingNextPage,
      hasNextPage: query.hasNextPage,
      isFetchingNextPage: query.isFetchingNextPage,
      fetchNextPage: () => query.fetchNextPage(),
    },
  };
}
