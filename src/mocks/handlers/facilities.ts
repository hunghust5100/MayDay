import { authenticate } from '../core/auth';
import { ok, type MockRequest } from '../core/http';
import type { RouteDef } from '../core/router';
import { queryInt } from '../core/validate';
import { db } from '../db/store';

// Tài liệu: "Quản lý CSVC và Hạ tầng tổ chức" — mới mock các API đọc danh sách (cần cho tạo nhân viên / phân công).

const byName = <T extends { name: string }>(a: T, b: T) => a.name.localeCompare(b.name, 'vi');

/** branch02 — Danh sách chi nhánh, sắp theo tên. */
function listBranches(req: MockRequest) {
  authenticate(req);
  return ok([...db.branches.values()].sort(byName));
}

/** dept02 — Danh sách khoa, lọc `branch_id`. */
function listDepartments(req: MockRequest) {
  authenticate(req);
  const branchId = queryInt(req, 'branch_id');
  return ok([...db.departments.values()].filter((d) => branchId === undefined || d.branch_id === branchId).sort(byName));
}

/** room02 — Danh sách phòng, lọc `department_id`. */
function listRooms(req: MockRequest) {
  authenticate(req);
  const departmentId = queryInt(req, 'department_id');
  return ok([...db.rooms.values()].filter((r) => departmentId === undefined || r.department_id === departmentId).sort(byName));
}

export const facilityRoutes: RouteDef[] = [
  ['GET', '/branches', listBranches],
  ['GET', '/departments', listDepartments],
  ['GET', '/rooms', listRooms],
];
