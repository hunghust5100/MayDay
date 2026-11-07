import { api } from '@/core/api';

import type { Branch, Department, Room } from '../types';

export const facilitiesApi = {
  /** branch02 */
  branches: (signal?: AbortSignal) => api.get<Branch[]>('/branches', { signal }),
  /** dept02 — lọc theo chi nhánh. */
  departments: (branchId: number | undefined, signal?: AbortSignal) =>
    api.get<Department[]>('/departments', { query: { branch_id: branchId }, signal }),
  /** room02 — lọc theo khoa. */
  rooms: (departmentId: number | undefined, signal?: AbortSignal) =>
    api.get<Room[]>('/rooms', { query: { department_id: departmentId }, signal }),
};
