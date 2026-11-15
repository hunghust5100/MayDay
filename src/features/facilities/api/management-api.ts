import { api } from '@/core/api';
import type { Branch, Department, Room } from '../types';

export type FacilityKind = 'branches' | 'departments' | 'rooms';
export type Facility = Branch | Department | Room;
export type FacilityInput = {
  name: string;
  address?: string;
  phone?: string;
  description?: string | null;
  branch_id?: number;
  department_id?: number;
};
export const facilityLabels: Record<FacilityKind, string> = {
  branches: 'Chi nhánh',
  departments: 'Khoa',
  rooms: 'Phòng khám',
};
export function isFacilityKind(value: unknown): value is FacilityKind {
  return value === 'branches' || value === 'departments' || value === 'rooms';
}
/** Chuẩn hóa ID chuỗi/số trong các bảng đặc tả về number. */
export function normalizeFacility<T extends Facility>(row: T): T {
  return {
    ...row,
    id: Number(row.id),
    ...('branch_id' in row ? { branch_id: Number(row.branch_id) } : {}),
    ...('department_id' in row ? { department_id: row.department_id == null ? null : Number(row.department_id) } : {}),
  };
}
export const managementApi = {
  detail: async (kind: FacilityKind, id: number, signal?: AbortSignal) =>
    normalizeFacility(await api.get<Facility>(`/${kind}/${id}`, { signal })),
  create: async (kind: FacilityKind, body: FacilityInput) => {
    const result = await api.post<Facility | Facility[]>(`/${kind}`, body);
    return normalizeFacility(Array.isArray(result) ? result[0] : result);
  },
  edit: async (kind: FacilityKind, id: number, body: FacilityInput) =>
    normalizeFacility(await api.put<Facility>(`/${kind}/${id}`, body)),
  remove: (kind: FacilityKind, id: number) => api.delete(`/${kind}/${id}`),
};
