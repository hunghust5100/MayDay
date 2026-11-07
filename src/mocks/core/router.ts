import type { MockRequest, MockResponse } from './http';

export type MockHandler = (req: MockRequest) => MockResponse | Promise<MockResponse>;

/** Khai báo route: `[method, pattern, handler]`, pattern dạng `/admin/users/:id`. */
export type RouteDef = readonly [method: string, pattern: string, handler: MockHandler];

type CompiledRoute = { method: string; regex: RegExp; keys: string[]; handler: MockHandler };

function compile([method, pattern, handler]: RouteDef): CompiledRoute {
  const keys: string[] = [];
  const source = pattern
    .split('/')
    .map((segment) => {
      if (!segment.startsWith(':')) return segment.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      keys.push(segment.slice(1));
      return '([^/]+)';
    })
    .join('/');
  return { method, regex: new RegExp(`^${source}/?$`), keys, handler };
}

export function createRouter(definitions: readonly RouteDef[]) {
  const routes = definitions.map(compile);
  return {
    /** Tìm handler khớp method + path; trả `null` nếu chưa mock endpoint này. */
    match(method: string, path: string) {
      for (const route of routes) {
        if (route.method !== method) continue;
        const found = route.regex.exec(path);
        if (!found) continue;
        const params: Record<string, string> = {};
        route.keys.forEach((key, i) => {
          params[key] = decodeURIComponent(found[i + 1]);
        });
        return { handler: route.handler, params };
      }
      return null;
    },
  };
}
