import { api } from '@/core/api';

import type { Branch, Department, Room } from '../types';
import { normalizeFacility } from './management-api';

export const facilitiesApi = {
  /** branch02 */
  branches: async (signal?: AbortSignal) => (await api.get<Branch[]>('/branches', { signal })).map(normalizeFacility),
  /** dept02 — lọc theo chi nhánh. */
  departments: (branchId: number | undefined, signal?: AbortSignal) =>
    api
      .get<Department[]>('/departments', { query: { branch_id: branchId }, signal })
      .then((rows) => rows.map(normalizeFacility)),
  /** room02 — lọc theo khoa. */
  rooms: (departmentId: number | undefined, signal?: AbortSignal) =>
    api
      .get<Room[]>('/rooms', { query: { department_id: departmentId }, signal })
      .then((rows) => rows.map(normalizeFacility)),
};
