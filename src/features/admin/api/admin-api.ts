import { api } from '@/core/api';

import type {
  AssignPermissionsResult,
  AssignWorkplaceRequest,
  CreatedUser,
  CreateRoleRequest,
  CreateStaffRequest,
  CreateUserRequest,
  EditUserRequest,
  Permission,
  PermissionRequest,
  Role,
  RolePermission,
  Staff,
  UserDetail,
  UserFilters,
  UserListItem,
} from '../types';

type Empty = Record<string, never>;

export const adminApi = {
  // ---- Người dùng (admin01–06, auth07) ----
  users: (params: UserFilters & { page: number; limit: number }, signal?: AbortSignal) =>
    api.getPage<UserListItem>('/admin/users', { query: params, signal }),
  user: (id: number, signal?: AbortSignal) => api.get<UserDetail>(`/admin/users/${id}`, { signal }),
  createUser: (body: CreateUserRequest) => api.post<CreatedUser>('/admin/users', body),
  createStaff: (body: CreateStaffRequest) => api.post<Staff>('/auth/admin/create-staff', body),
  editUser: (id: number, body: EditUserRequest) => api.put<UserDetail>(`/admin/users/${id}`, body),
  deleteUser: (id: number) => api.delete<Empty>(`/admin/users/${id}`),
  assignUser: (id: number, body: AssignWorkplaceRequest) =>
    api.put<AssignWorkplaceRequest & { user_id: number }>(`/admin/users/${id}/assign`, body),

  // ---- Vai trò (role01–02) ----
  roles: (signal?: AbortSignal) => api.get<Role[]>('/roles', { signal }),
  createRole: (body: CreateRoleRequest) => api.post<Role>('/roles', body),

  // ---- Quyền hạn (perm01–04) ----
  permissions: (signal?: AbortSignal) => api.get<Permission[]>('/permissions', { signal }),
  createPermission: (body: PermissionRequest) => api.post<Permission>('/permissions', body),
  editPermission: (id: number, body: PermissionRequest) => api.put<Permission>(`/permissions/${id}`, body),
  deletePermission: (id: number) => api.delete<Empty>(`/permissions/${id}`),

  // ---- Cấp quyền cho vai trò (roleperm01–03) ----
  rolePermissions: (roleId: number, signal?: AbortSignal) =>
    api.get<RolePermission[]>(`/role_permissions/role/${roleId}`, { signal }),
  assignPermissions: (roleId: number, permissions: number[]) =>
    api.post<AssignPermissionsResult>('/role_permissions', { role_id: roleId, permissions }),
  revokePermission: (roleId: number, permissionId: number) =>
    api.delete<Empty>(`/role_permissions/${roleId}/${permissionId}`),
};
