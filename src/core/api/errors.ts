import { RESPONSE_MESSAGES } from './response-codes';

/** Mã lỗi phía client (không có trong bảng mã của server). */
export type ClientErrorCode = 'NETWORK' | 'TIMEOUT' | 'BAD_RESPONSE';

const CLIENT_MESSAGES: Record<ClientErrorCode, string> = {
  NETWORK: 'Không kết nối được máy chủ. Vui lòng kiểm tra mạng.',
  TIMEOUT: 'Máy chủ phản hồi quá lâu. Vui lòng thử lại.',
  BAD_RESPONSE: 'Phản hồi từ máy chủ không hợp lệ.',
};

/** Lỗi thống nhất của mọi lời gọi API. */
export class ApiError extends Error {
  /** Mã phản hồi của server (`2001`, `3008`...) hoặc mã lỗi client. */
  readonly code: string;
  /** Message gốc từ server (tiếng Anh, để log). */
  readonly serverMessage?: string;
  readonly httpStatus?: number;

  constructor(code: string, options: { serverMessage?: string; httpStatus?: number } = {}) {
    super(RESPONSE_MESSAGES[code] ?? CLIENT_MESSAGES[code as ClientErrorCode] ?? options.serverMessage ?? 'Đã có lỗi xảy ra.');
    this.name = 'ApiError';
    this.code = code;
    this.serverMessage = options.serverMessage;
    this.httpStatus = options.httpStatus;
  }

  /** Lỗi mạng/timeout — nên cho phép thử lại. */
  get isNetworkError() {
    return this.code === 'NETWORK' || this.code === 'TIMEOUT';
  }
}

export function isApiError(error: unknown): error is ApiError {
  return error instanceof ApiError;
}

/** Thông báo tiếng Việt cho mọi loại lỗi — dùng cho toast/ErrorState. */
export function getErrorMessage(error: unknown): string {
  if (isApiError(error)) return error.message;
  return 'Đã có lỗi xảy ra. Vui lòng thử lại.';
}
