import { authenticate, requireAdmin } from '../core/auth';
import { created, ok, reject, type MockRequest } from '../core/http';
import type { RouteDef } from '../core/router';
import { paramInt, queryInt, readBody, requireFields, reqString, reqInt, optString } from '../core/validate';
import { db, nextId, nowString } from '../db/store';

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
  return ok(
    [...db.departments.values()].filter((d) => branchId === undefined || d.branch_id === branchId).sort(byName),
  );
}

/** room02 — Danh sách phòng, lọc `department_id`. */
function listRooms(req: MockRequest) {
  authenticate(req);
  const departmentId = queryInt(req, 'department_id');
  return ok(
    [...db.rooms.values()].filter((r) => departmentId === undefined || r.department_id === departmentId).sort(byName),
  );
}

export const facilityRoutes: RouteDef[] = [
  ['GET', '/branches', listBranches],
  ['GET', '/departments', listDepartments],
  ['GET', '/rooms', listRooms],
  ...(['branches', 'departments', 'rooms'] as const).flatMap((kind): RouteDef[] => [
    [
      'GET',
      `/${kind}/:id`,
      (req) => {
        authenticate(req);
        const row = db[kind].get(paramInt(req, 'id'));
        if (!row) reject('2003');
        return ok(row);
      },
    ],
    ['POST', `/${kind}`, (req) => save(kind, req)],
    ['PUT', `/${kind}/:id`, (req) => save(kind, req)],
    [
      'DELETE',
      `/${kind}/:id`,
      (req) => {
        requireAdmin(req);
        const id = paramInt(req, 'id');
        if (!db[kind].has(id)) reject('2003');
        if (
          kind === 'branches' &&
          ([...db.departments.values()].some((d) => d.branch_id === id) ||
            [...db.staffs.values()].some((s) => s.branch_id === id))
        )
          reject('2003');
        if (kind === 'rooms' && [...db.staffs.values()].some((s) => s.room_id === id)) reject('2003');
        // Nhân viên có FK khoa cũng phải được bảo toàn; SET NULL chỉ áp dụng rooms.
        if (kind === 'departments' && [...db.staffs.values()].some((s) => s.department_id === id)) reject('2003');
        if (kind === 'departments')
          for (const room of db.rooms.values())
            if (room.department_id === id) {
              room.department_id = null;
              room.updated_at = nowString();
            }
        db[kind].delete(id);
        return ok();
      },
    ],
  ]),
];

function save(kind: 'branches' | 'departments' | 'rooms', req: MockRequest) {
  requireAdmin(req);
  const body = readBody(req);
  const inserting = req.method === 'POST';
  const id = inserting ? nextId(db[kind]) : paramInt(req, 'id');
  const previous = db[kind].get(id);
  if (!inserting && !previous) reject('2003');
  const merged = { ...previous, ...body };
  requireFields(
    merged,
    kind === 'branches'
      ? ['name', 'address', 'phone']
      : kind === 'departments'
        ? ['name', 'branch_id']
        : ['name', 'department_id'],
  );
  const name = reqString(merged, 'name').trim();
  const stamp = { id, name, created_at: previous?.created_at ?? nowString(), updated_at: nowString() };
  if (kind === 'branches') {
    const phone = reqString(merged, 'phone').trim();
    if (!/^[0-9+() .-]{8,20}$/.test(phone)) reject('2003');
    db.branches.set(id, { ...stamp, phone, address: reqString(merged, 'address').trim() });
  } else if (kind === 'departments') {
    const branchId = reqInt(merged, 'branch_id');
    if (!db.branches.has(branchId)) reject('2003');
    if (
      previous &&
      'branch_id' in previous &&
      previous.branch_id !== branchId &&
      [...db.staffs.values()].some(
        (s) => s.department_id === id || (s.room_id != null && db.rooms.get(s.room_id)?.department_id === id),
      )
    )
      reject('2003');
    db.departments.set(id, { ...stamp, description: optString(merged, 'description') ?? null, branch_id: branchId });
  } else {
    const departmentId = reqInt(merged, 'department_id');
    if (!db.departments.has(departmentId)) reject('2003');
    if (
      previous &&
      'department_id' in previous &&
      previous.department_id !== departmentId &&
      [...db.staffs.values()].some((s) => s.room_id === id)
    )
      reject('2003');
    db.rooms.set(id, { ...stamp, description: optString(merged, 'description') ?? null, department_id: departmentId });
  }
  return inserting ? created(db[kind].get(id)) : ok(db[kind].get(id));
}
