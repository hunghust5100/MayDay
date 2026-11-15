import { Platform } from 'react-native';

import { session } from '@/core/auth';
import { env } from '@/core/config';
import { toast } from '@/shared/ui';

import { ApiError } from './errors';
import { SESSION_EXPIRED_CODES, SUCCESS_CODES } from './response-codes';

type QueryValue = string | number | boolean | null | undefined;
export type QueryParams = Record<string, QueryValue | readonly QueryValue[]>;

export type RequestOptions = {
  /** Tham số query string; giá trị null/undefined/'' bị bỏ qua. */
  query?: QueryParams;
  /** Body JSON. */
  body?: unknown;
  /** Body multipart (upload ảnh) — dùng `createFormData`. */
  formData?: FormData;
  /** Hủy request (react-query truyền vào tự động). */
  signal?: AbortSignal;
  /** Gắn header Authorization (mặc định có). Tắt cho login/signup/forgot-password. */
  auth?: boolean;
  timeout?: number;
};

/** Base Response của server: `{ code, message, data, total? }`. */
type BaseResponse<T> = { code: string; message: string; data: T; total?: number };

/** Kết quả một trang dữ liệu. */
export type Page<T> = { items: T[]; total: number };

function buildUrl(path: string, query?: QueryParams) {
  const url = `${env.apiUrl}${path.startsWith('/') ? path : `/${path}`}`;
  if (!query) return url;
  const parts: string[] = [];
  for (const [key, raw] of Object.entries(query)) {
    const values = Array.isArray(raw) ? raw : [raw];
    for (const value of values) {
      if (value === null || value === undefined || value === '') continue;
      parts.push(`${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`);
    }
  }
  return parts.length ? `${url}?${parts.join('&')}` : url;
}

let expiring = false;

/** Token hỏng/hết hạn → xóa phiên một lần, báo một lần (dù nhiều request cùng lỗi). */
async function handleSessionExpired(error: ApiError) {
  if (expiring || session.getState().status !== 'signedIn') return;
  expiring = true;
  try {
    await session.signOut();
    toast.error(error.message);
  } finally {
    expiring = false;
  }
}

async function request<T>(method: string, path: string, options: RequestOptions = {}): Promise<BaseResponse<T>> {
  const { query, body, formData, signal, auth = true, timeout = env.apiTimeout } = options;

  const headers: Record<string, string> = { Accept: 'application/json' };
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  const token = auth ? session.getToken() : null;
  if (token) headers.Authorization = `Bearer ${token}`;

  // Gộp tín hiệu hủy từ bên ngoài với timeout (Hermes chưa có AbortSignal.any).
  const controller = new AbortController();
  let timedOut = false;
  const timer = setTimeout(() => {
    timedOut = true;
    controller.abort();
  }, timeout);
  const onExternalAbort = () => controller.abort();
  signal?.addEventListener('abort', onExternalAbort);

  let response: Response;
  try {
    response = await fetch(buildUrl(path, query), {
      method,
      headers,
      body: formData ?? (body !== undefined ? JSON.stringify(body) : undefined),
      signal: controller.signal,
    });
  } catch (cause) {
    if (signal?.aborted) throw cause; // bị hủy chủ động → để react-query xử lý
    throw new ApiError(timedOut ? 'TIMEOUT' : 'NETWORK');
  } finally {
    clearTimeout(timer);
    signal?.removeEventListener('abort', onExternalAbort);
  }

  let json: BaseResponse<T>;
  try {
    json = (await response.json()) as BaseResponse<T>;
  } catch {
    throw new ApiError(response.ok ? 'BAD_RESPONSE' : '9901', { httpStatus: response.status });
  }
  if (!json || typeof json.code !== 'string') throw new ApiError('BAD_RESPONSE', { httpStatus: response.status });

  if (!SUCCESS_CODES.has(json.code)) {
    const error = new ApiError(json.code, { serverMessage: json.message, httpStatus: response.status });
    if (token && SESSION_EXPIRED_CODES.has(json.code)) await handleSessionExpired(error);
    throw error;
  }
  return json;
}

/**
 * Gọi REST API: tự gắn JWT, chuẩn hóa Base Response, nhận 1000/1001; mã khác ném `ApiError` tiếng Việt.
 * Các hàm trả thẳng `data`; `getPage` trả `{ items, total }` cho danh sách phân trang.
 */
export const api = {
  get: async <T>(path: string, options?: Omit<RequestOptions, 'body' | 'formData'>) =>
    (await request<T>('GET', path, options)).data,

  getPage: async <T>(path: string, options?: Omit<RequestOptions, 'body' | 'formData'>): Promise<Page<T>> => {
    const res = await request<T[]>('GET', path, options);
    return { items: res.data ?? [], total: res.total ?? res.data?.length ?? 0 };
  },

  post: async <T>(path: string, body?: unknown, options?: Omit<RequestOptions, 'body'>) =>
    (await request<T>('POST', path, { ...options, body })).data,

  put: async <T>(path: string, body?: unknown, options?: Omit<RequestOptions, 'body'>) =>
    (await request<T>('PUT', path, { ...options, body })).data,

  patch: async <T>(path: string, body?: unknown, options?: Omit<RequestOptions, 'body'>) =>
    (await request<T>('PATCH', path, { ...options, body })).data,

  delete: async <T>(path: string, options?: Omit<RequestOptions, 'body' | 'formData'>) =>
    (await request<T>('DELETE', path, options)).data,

  /** Gửi multipart/form-data (POST). */
  upload: async <T>(path: string, formData: FormData, options?: Omit<RequestOptions, 'body' | 'formData'>) =>
    (await request<T>('POST', path, { ...options, formData })).data,
};

/** Tệp cần gửi kèm (khớp `PickedImage` của shared/form). */
export type UploadFile = { uri: string; name: string; mimeType: string };

/**
 * Tạo FormData cho upload: `fields` là trường thường, `files` lặp lại cùng key cho nhiều tệp
 * (VD key `images` cho upload hàng loạt).
 */
export async function createFormData(
  fields: Record<string, QueryValue>,
  files: Record<string, UploadFile | readonly UploadFile[]>,
): Promise<FormData> {
  const form = new FormData();
  for (const [key, value] of Object.entries(fields)) {
    if (value !== null && value !== undefined) form.append(key, String(value));
  }
  for (const [key, entry] of Object.entries(files)) {
    const list: readonly UploadFile[] = Array.isArray(entry) ? entry : [entry as UploadFile];
    for (const file of list) {
      if (Platform.OS === 'web') {
        const blob = await (await fetch(file.uri)).blob();
        form.append(key, blob, file.name);
      } else {
        // React Native nhận object { uri, name, type } thay cho Blob.
        form.append(key, { uri: file.uri, name: file.name, type: file.mimeType } as unknown as Blob);
      }
    }
  }
  return form;
}
