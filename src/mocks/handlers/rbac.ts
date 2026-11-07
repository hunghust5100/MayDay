import { requireAdmin } from '../core/auth';
import { ok, reject, type MockRequest } from '../core/http';
import type { RouteDef } from '../core/router';
import { optInt, optString, paramInt, readBody, reqInt, reqString, requireAny, requireFields } from '../core/validate';
import { db, nextId, nowString, type PermissionRow } from '../db/store';

// Tài liệu: "Quản trị người dùng, Phân Quyền" — role01–02, perm01–04, roleperm01–03. Mọi API cần token Admin.

const sameName = (a: string, b: string) => a.toLowerCase() === b.toLowerCase();

// ---- Vai trò ----

/** role01 — Tạo vai trò (tên duy nhất, có thể có vai trò cha). */
function createRole(req: MockRequest) {
  requireAdmin(req);
  const body = readBody(req);
  requireFields(body, ['name']);
  const name = reqString(body, 'name').trim();
  const description = optString(body, 'description');
  const parentRoleId = optInt(body, 'parent_role_id');
  if ([...db.roles.values()].some((role) => sameName(role.name, name))) reject('2003');
  if (parentRoleId != null && !db.roles.has(parentRoleId)) reject('2003');

  const now = nowString();
  const role = {
    id: nextId(db.roles),
    name,
    description: description?.trim() || null,
    parent_role_id: parentRoleId ?? null,
    created_at: now,
    updated_at: now,
  };
  db.roles.set(role.id, role);
  const { updated_at: _, ...data } = role;
  return ok(data);
}

/** role02 — Danh sách vai trò (client dựng cây tổ chức từ `parent_role_id`). */
function listRoles(req: MockRequest) {
  requireAdmin(req);
  return ok([...db.roles.values()].map(({ id, name, description, parent_role_id }) => ({ id, name, description, parent_role_id })));
}

// ---- Quyền hạn ----

const permissionNameTaken = (name: string, exceptId?: number) =>
  [...db.permissions.values()].some((permission) => permission.id !== exceptId && sameName(permission.name, name));

/** perm01 — Tạo quyền. */
function createPermission(req: MockRequest) {
  requireAdmin(req);
  const body = readBody(req);
  requireFields(body, ['name']);
  const name = reqString(body, 'name').trim();
  const description = optString(body, 'description');
  if (permissionNameTaken(name)) reject('2003');

  const now = nowString();
  const permission: PermissionRow = {
    id: nextId(db.permissions),
    name,
    description: description?.trim() || null,
    created_at: now,
    updated_at: now,
  };
  db.permissions.set(permission.id, permission);
  return ok(permission);
}

/** perm02 — Danh sách quyền. */
function listPermissions(req: MockRequest) {
  requireAdmin(req);
  return ok([...db.permissions.values()]);
}

/** perm03 — Sửa quyền (một phần). `id` không tồn tại → 2003 theo tài liệu. */
function editPermission(req: MockRequest) {
  requireAdmin(req);
  const id = paramInt(req, 'id');
  const body = readBody(req);
  requireAny(body, ['name', 'description']);
  const name = optString(body, 'name');
  const description = optString(body, 'description');
  const permission = db.permissions.get(id);
  if (!permission) reject('2003');
  if (name !== undefined && (!name?.trim() || permissionNameTaken(name.trim(), id))) reject('2003');

  if (name) permission.name = name.trim();
  if (description !== undefined) permission.description = description?.trim() || null;
  permission.updated_at = nowString();
  return ok(permission);
}

/** perm04 — Xóa quyền; CASCADE `role_permissions` → vai trò đang có quyền này tự mất quyền. */
function deletePermission(req: MockRequest) {
  requireAdmin(req);
  const id = paramInt(req, 'id');
  if (!db.permissions.has(id)) reject('2003');
  db.permissions.delete(id);
  db.role_permissions = db.role_permissions.filter((row) => row.permission_id !== id);
  return ok();
}

// ---- Cấp quyền cho vai trò ----

/** roleperm01 — Cấp nhiều quyền cho vai trò; idempotent (quyền đã có → bỏ qua, tính `skipped_count`). */
function assignPermissions(req: MockRequest) {
  requireAdmin(req);
  const body = readBody(req);
  const permissions = body.permissions;
  if (body.role_id == null || permissions == null || (Array.isArray(permissions) && permissions.length === 0)) {
    reject('2001');
  }
  const roleId = reqInt(body, 'role_id');
  if (!Array.isArray(permissions) || !permissions.every((id) => typeof id === 'number' && Number.isInteger(id))) {
    reject('2002');
  }
  const permissionIds = [...new Set(permissions as number[])];
  // Transaction: một ID sai thì không ghi gì.
  if (!db.roles.has(roleId) || permissionIds.some((id) => !db.permissions.has(id))) reject('2003');

  const now = nowString();
  let added = 0;
  for (const permissionId of permissionIds) {
    if (db.role_permissions.some((row) => row.role_id === roleId && row.permission_id === permissionId)) continue;
    db.role_permissions.push({ id: nextId(db.role_permissions), role_id: roleId, permission_id: permissionId, created_at: now });
    added += 1;
  }
  return ok({ role_id: roleId, added_count: added, skipped_count: (permissions as number[]).length - added });
}

/** roleperm02 — Danh sách quyền của một vai trò. */
function getRolePermissions(req: MockRequest) {
  requireAdmin(req);
  const roleId = paramInt(req, 'role_id');
  if (!db.roles.has(roleId)) reject('2003');
  return ok(
    db.role_permissions
      .filter((row) => row.role_id === roleId)
      .map((row) => {
        const permission = db.permissions.get(row.permission_id);
        return {
          role_permission_id: row.id,
          permission_id: row.permission_id,
          name: permission?.name ?? '',
          description: permission?.description ?? null,
          assigned_at: row.created_at,
        };
      }),
  );
}

/** roleperm03 — Thu hồi một quyền khỏi vai trò. */
function revokePermission(req: MockRequest) {
  requireAdmin(req);
  const roleId = paramInt(req, 'role_id');
  const permissionId = paramInt(req, 'permission_id');
  const index = db.role_permissions.findIndex((row) => row.role_id === roleId && row.permission_id === permissionId);
  if (index === -1) reject('2003');
  db.role_permissions.splice(index, 1);
  return ok();
}

export const rbacRoutes: RouteDef[] = [
  ['POST', '/roles', createRole],
  ['GET', '/roles', listRoles],
  ['POST', '/permissions', createPermission],
  ['GET', '/permissions', listPermissions],
  ['PUT', '/permissions/:id', editPermission],
  ['DELETE', '/permissions/:id', deletePermission],
  ['POST', '/role_permissions', assignPermissions],
  ['GET', '/role_permissions/role/:role_id', getRolePermissions],
  ['DELETE', '/role_permissions/:role_id/:permission_id', revokePermission],
];
