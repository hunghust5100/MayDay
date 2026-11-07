import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { usePaginatedQuery } from '@/core/api';
import { ROLE_IDS } from '@/core/auth';

import { adminApi } from '../api/admin-api';
import type { AssignWorkplaceRequest, EditUserRequest, UserFilters } from '../types';

/** Mọi query người dùng nằm dưới khóa này → thêm/sửa/xóa chỉ cần invalidate một lần. */
const USERS = ['admin', 'users'] as const;

export function useUsers(filters: UserFilters) {
  return usePaginatedQuery({
    queryKey: [...USERS, 'list', filters],
    queryFn: ({ page, limit, signal }) => adminApi.users({ ...filters, page, limit }, signal),
  });
}

export function useUser(id: number) {
  return useQuery({
    queryKey: [...USERS, 'detail', id],
    queryFn: ({ signal }) => adminApi.user(id, signal),
    enabled: Number.isInteger(id),
  });
}

/** Số liệu tổng quan cho trang chủ admin (đếm qua `total` của admin02, mỗi truy vấn chỉ lấy 1 dòng). */
export function useUserStats() {
  return useQuery({
    queryKey: [...USERS, 'stats'],
    queryFn: async ({ signal }) => {
      const count = (filters: UserFilters) => adminApi.users({ ...filters, page: 1, limit: 1 }, signal).then((r) => r.total);
      const [total, patients, locked] = await Promise.all([
        count({}),
        count({ role_id: ROLE_IDS.PATIENT }),
        count({ is_active: 0 }),
      ]);
      return { total, patients, staff: total - patients, locked };
    },
  });
}

function useInvalidateUsers() {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: USERS });
}

export function useCreateUser() {
  const invalidate = useInvalidateUsers();
  return useMutation({ mutationFn: adminApi.createUser, onSuccess: invalidate, meta: { silent: true } });
}

export function useCreateStaff() {
  const invalidate = useInvalidateUsers();
  return useMutation({ mutationFn: adminApi.createStaff, onSuccess: invalidate, meta: { silent: true } });
}

export function useEditUser(id: number) {
  const invalidate = useInvalidateUsers();
  return useMutation({ mutationFn: (body: EditUserRequest) => adminApi.editUser(id, body), onSuccess: invalidate });
}

export function useDeleteUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: adminApi.deleteUser,
    onSuccess: (_data, id) => {
      queryClient.removeQueries({ queryKey: [...USERS, 'detail', id] });
      return queryClient.invalidateQueries({ queryKey: USERS });
    },
  });
}

export function useAssignUser(id: number) {
  const invalidate = useInvalidateUsers();
  return useMutation({ mutationFn: (body: AssignWorkplaceRequest) => adminApi.assignUser(id, body), onSuccess: invalidate });
}
