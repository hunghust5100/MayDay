import { useQuery } from '@tanstack/react-query';

import { facilitiesApi } from '../api/facilities-api';

const STALE = 5 * 60_000; // danh mục ít thay đổi

export function useBranches() {
  return useQuery({ queryKey: ['facilities', 'branches'], queryFn: ({ signal }) => facilitiesApi.branches(signal), staleTime: STALE });
}

/** Danh sách khoa; `branchId` trống → tất cả. */
export function useDepartments(branchId?: number | null) {
  return useQuery({
    queryKey: ['facilities', 'departments', branchId ?? 'all'],
    queryFn: ({ signal }) => facilitiesApi.departments(branchId ?? undefined, signal),
    staleTime: STALE,
  });
}

/** Danh sách phòng; `departmentId` trống → tất cả. */
export function useRooms(departmentId?: number | null) {
  return useQuery({
    queryKey: ['facilities', 'rooms', departmentId ?? 'all'],
    queryFn: ({ signal }) => facilitiesApi.rooms(departmentId ?? undefined, signal),
    staleTime: STALE,
  });
}
