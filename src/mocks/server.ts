import { MOCK_CONFIG } from './config';
import { errorResponse, MockApiError, type MockRequest, type MockResponse } from './core/http';
import { createRouter } from './core/router';
import { adminUserRoutes } from './handlers/admin-users';
import { authRoutes } from './handlers/auth';
import { facilityRoutes } from './handlers/facilities';
import { rbacRoutes } from './handlers/rbac';

const router = createRouter([...authRoutes, ...adminUserRoutes, ...rbacRoutes, ...facilityRoutes]);

/** Xử lý một request giả: tìm route → chạy handler → chuyển lỗi nghiệp vụ thành Base Response. */
export async function handleMockRequest(req: Omit<MockRequest, 'params'>): Promise<MockResponse> {
  const route = router.match(req.method, req.path);
  if (!route) {
    console.warn(`[mock] Chưa có mock cho ${req.method} ${req.path}`);
    return { status: 404, body: { code: '9901', message: `Mock not implemented: ${req.method} ${req.path}`, data: {} } };
  }
  try {
    return await route.handler({ ...req, params: route.params });
  } catch (error) {
    if (error instanceof MockApiError) return errorResponse(error);
    console.error('[mock] Lỗi trong handler', error);
    return errorResponse(new MockApiError('9901'));
  }
}

export const randomLatency = () =>
  MOCK_CONFIG.latency.min + Math.random() * (MOCK_CONFIG.latency.max - MOCK_CONFIG.latency.min);
