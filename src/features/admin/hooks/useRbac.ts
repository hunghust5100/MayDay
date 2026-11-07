import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { adminApi } from '../api/admin-api';
import type { PermissionRequest, Role } from '../types';

const ROLES = ['admin', 'roles'] as const;
const PERMISSIONS = ['admin', 'permissions'] as const;

export function useRoles() {
  return useQuery({ queryKey: ROLES, queryFn: ({ signal }) => adminApi.roles(signal), staleTime: 60_000 });
}

/** Tên hiển thị của vai trò: ưu tiên `description` (tiếng Việt), không có thì `name`. */
export const roleTitle = (role: Pick<Role, 'name' | 'description'>) => role.description || role.name;

/** Hàm tra tên vai trò theo `role_id` (dùng danh sách vai trò đã tải). */
export function useRoleLabel() {
  const { data: roles } = useRoles();
  return (roleId: number) => {
    const role = roles?.find((r) => r.id === roleId);
    return role ? roleTitle(role) : `Vai trò #${roleId}`;
  };
}

export function useCreateRole() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: adminApi.createRole,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ROLES }),
    meta: { silent: true },
  });
}

export function usePermissions() {
  return useQuery({ queryKey: PERMISSIONS, queryFn: ({ signal }) => adminApi.permissions(signal) });
}

export function useCreatePermission() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: adminApi.createPermission,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: PERMISSIONS }),
    meta: { silent: true },
  });
}

export function useEditPermission(id: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: PermissionRequest) => adminApi.editPermission(id, body),
    onSuccess: () => Promise.all([
      queryClient.invalidateQueries({ queryKey: PERMISSIONS }),
      queryClient.invalidateQueries({ queryKey: ROLES }),
    ]),
    meta: { silent: true },
  });
}

/** Xóa quyền: các vai trò đang có quyền này cũng mất quyền (CASCADE) → làm mới cả quyền của vai trò. */
export function useDeletePermission() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: adminApi.deletePermission,
    onSuccess: () => Promise.all([
      queryClient.invalidateQueries({ queryKey: PERMISSIONS }),
      queryClient.invalidateQueries({ queryKey: ROLES }),
    ]),
  });
}

export function useRolePermissions(roleId: number) {
  return useQuery({
    queryKey: [...ROLES, roleId, 'permissions'],
    queryFn: ({ signal }) => adminApi.rolePermissions(roleId, signal),
    enabled: Number.isInteger(roleId),
  });
}

export function useAssignPermissions(roleId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (permissionIds: number[]) => adminApi.assignPermissions(roleId, permissionIds),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [...ROLES, roleId, 'permissions'] }),
  });
}

export function useRevokePermission(roleId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (permissionId: number) => adminApi.revokePermission(roleId, permissionId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [...ROLES, roleId, 'permissions'] }),
  });
}
