import { isCancelledError, MutationCache, onlineManager, QueryClient } from '@tanstack/react-query';

import { toast } from '@/shared/ui';

import { getErrorMessage, isApiError } from './errors';
import { SESSION_EXPIRED_CODES } from './response-codes';

declare module '@tanstack/react-query' {
  interface Register {
    defaultError: Error;
    mutationMeta: {
      /** Không tự hiện toast lỗi (màn hình tự xử lý, VD hiện lỗi dưới ô nhập). */
      silent?: boolean;
    };
  }
}

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      networkMode: 'offlineFirst',
      staleTime: 30_000,
      // Chỉ thử lại lỗi mạng; lỗi nghiệp vụ (mã 2xxx–9xxx) thử lại cũng vô ích.
      retry: (failureCount, error) => onlineManager.isOnline() && isApiError(error) && error.isNetworkError && failureCount < 2,
    },
    // Offline writes fail immediately at the HTTP boundary. No medical edits are replayed.
    mutations: { retry: false, networkMode: 'always' },
  },
  mutationCache: new MutationCache({
    onError: (error, _variables, _context, mutation) => {
      if (mutation.meta?.silent || isCancelledError(error)) return;
      if (isApiError(error) && SESSION_EXPIRED_CODES.has(error.code)) return; // client đã báo
      toast.error(getErrorMessage(error));
    },
  }),
});
