import { MOCK_CONFIG } from './config';
import { handleMockRequest, randomLatency } from './server';

/**
 * Mock API — giả lập backend REST theo đúng tài liệu trong `API/`, chạy ngay trong app (không cần server).
 *
 * Cách hoạt động: thay `globalThis.fetch`; request nào có URL bắt đầu bằng `baseUrl` thì do mock trả lời
 * (có độ trễ giả, hỗ trợ hủy/timeout), còn lại đi mạng thật như bình thường. Nhờ vậy `core/api` client,
 * JWT, Base Response, mã lỗi… chạy y hệt khi nối backend thật — tắt mock là dùng được API thật.
 *
 * Bật/tắt bằng `EXPO_PUBLIC_API_MOCK=true` trong `.env`. Module chỉ được import ở `app/_layout.tsx`.
 */

let installed = false;

function abortError() {
  const error = new Error('Aborted');
  error.name = 'AbortError';
  return error;
}

function wait(ms: number, signal?: AbortSignal | null) {
  return new Promise<void>((resolve, reject) => {
    if (signal?.aborted) return reject(abortError());
    const timer = setTimeout(() => {
      signal?.removeEventListener('abort', onAbort);
      resolve();
    }, ms);
    const onAbort = () => {
      clearTimeout(timer);
      reject(abortError());
    };
    signal?.addEventListener('abort', onAbort);
  });
}

/** Tách `?a=1&b=2` thành object (không phụ thuộc `URLSearchParams` — RN hỗ trợ chưa đầy đủ). */
function parseQuery(search: string): Record<string, string> {
  const query: Record<string, string> = {};
  for (const part of search.split('&')) {
    if (!part) continue;
    const [key, value = ''] = part.split('=');
    query[decodeURIComponent(key)] = decodeURIComponent(value.replace(/\+/g, ' '));
  }
  return query;
}

function readHeaders(headers: HeadersInit | undefined): Record<string, string> {
  const result: Record<string, string> = {};
  if (!headers) return result;
  const entries: [string, string][] =
    typeof Headers !== 'undefined' && headers instanceof Headers
      ? [...(headers as unknown as Iterable<[string, string]>)]
      : Array.isArray(headers)
        ? (headers as [string, string][])
        : Object.entries(headers as Record<string, string>);
  for (const [key, value] of entries) result[key.toLowerCase()] = value;
  return result;
}

/** Body JSON; body không parse được → `INVALID` để handler trả `2007`. */
function readBody(body: BodyInit | null | undefined): unknown {
  if (body === undefined || body === null) return undefined;
  if (typeof body !== 'string') return body; // FormData… — chưa có endpoint mock nào dùng
  try {
    return JSON.parse(body);
  } catch {
    return Symbol.for('mock.invalid-json');
  }
}

function toResponse(status: number, payload: unknown): Response {
  const text = JSON.stringify(payload);
  if (typeof Response !== 'undefined') {
    return new Response(text, { status, headers: { 'Content-Type': 'application/json' } });
  }
  // Dự phòng cho môi trường thiếu `Response`: client chỉ dùng ok/status/json().
  return { ok: status >= 200 && status < 300, status, json: async () => JSON.parse(text) } as Response;
}

export function installMockApi({ baseUrl }: { baseUrl: string }) {
  if (installed) return;
  installed = true;

  const realFetch = globalThis.fetch.bind(globalThis);
  const prefix = baseUrl.replace(/\/+$/, '');

  globalThis.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url;
    if (!url.startsWith(`${prefix}/`)) return realFetch(input, init);

    const method = (init?.method ?? (typeof input === 'object' && 'method' in input ? input.method : 'GET')).toUpperCase();
    const [pathname, search = ''] = url.slice(prefix.length).split('?');

    await wait(randomLatency(), init?.signal);
    const result = await handleMockRequest({
      method,
      path: pathname,
      query: parseQuery(search),
      headers: readHeaders(init?.headers),
      body: readBody(init?.body),
    });
    if (MOCK_CONFIG.log) console.log(`[mock] ${method} ${pathname} → ${result.body.code}`);
    return toResponse(result.status, result.body);
  };

  console.info(`[mock] Đang dùng mock API cho ${prefix} — tài khoản đăng nhập thử xem README, mục 4.1.`);
}

export { resetDb as resetMockDb } from './db/store';
export { MOCK_CONFIG, ROLE as MOCK_ROLE } from './config';
