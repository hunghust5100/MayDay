import { toApiDateTime } from '@/shared/utils';

import { MOCK_CONFIG, ROLE } from '../config';
import { createClinicalSeed } from './clinical';
import { createModuleSeed } from './module-seed';
import type {
  BranchRow,
  DepartmentRow,
  MockDb,
  PatientRow,
  PermissionRow,
  RolePermissionRow,
  RoleRow,
  RoomRow,
  StaffRow,
  UserRow,
} from './store';

const SEED_TIME = '2026-10-01 08:00:00';

const ROLES: [id: number, name: string, description: string, parent: number | null][] = [
  [ROLE.ADMIN, 'admin', 'Quản trị hệ thống', null],
  [ROLE.DOCTOR, 'doctor', 'Bác sĩ', ROLE.HEAD_OF_DEPARTMENT],
  [ROLE.PATIENT, 'patient', 'Bệnh nhân', null],
  [ROLE.NURSE, 'nurse', 'Điều dưỡng', ROLE.HEAD_OF_DEPARTMENT],
  [ROLE.DIRECTOR, 'director', 'Giám đốc', null],
  [ROLE.HEAD_OF_DEPARTMENT, 'head_of_department', 'Trưởng khoa', ROLE.DIRECTOR],
  [ROLE.INTERN_DOCTOR, 'intern_doctor', 'Bác sĩ thực tập', ROLE.DOCTOR],
];

const PERMISSIONS: [id: number, name: string, description: string][] = [
  [1, 'manage_users', 'Quản lý người dùng'],
  [2, 'manage_roles', 'Quản lý vai trò và quyền hạn'],
  [3, 'manage_facilities', 'Quản lý chi nhánh, khoa, phòng khám'],
  [4, 'manage_templates', 'Quản lý mẫu phiếu khám'],
  [5, 'view_medical_records', 'Xem hồ sơ bệnh án'],
  [6, 'edit_medical_records', 'Tiếp nhận và cập nhật bệnh án'],
  [7, 'create_patients', 'Tạo bệnh nhân'],
  [8, 'prescribe', 'Kê đơn thuốc'],
  [9, 'request_labs', 'Chỉ định xét nghiệm'],
  [10, 'view_own_records', 'Xem hồ sơ, bệnh án của bản thân'],
  [11, 'submit_uas7', 'Chấm điểm UAS7'],
  [12, 'manage_lesions', 'Theo dõi tổn thương da'],
  [13, 'upload_images', 'Tải ảnh lên'],
  [14, 'manage_own_notifications', 'Hộp thư cá nhân (quyền fixture mock, không phải mapping backend đã chốt)'],
];

const ROLE_PERMISSIONS: Record<number, number[]> = {
  [ROLE.ADMIN]: [1, 2, 3, 4, 5],
  [ROLE.DOCTOR]: [5, 6, 7, 8, 9, 13],
  [ROLE.PATIENT]: [10, 11, 12, 13],
  [ROLE.NURSE]: [5, 7, 13],
  [ROLE.DIRECTOR]: [1, 3, 5],
  [ROLE.HEAD_OF_DEPARTMENT]: [5, 6, 7, 8, 9, 13],
  [ROLE.INTERN_DOCTOR]: [5, 13],
};

const stamp = { created_at: SEED_TIME, updated_at: SEED_TIME };

const BRANCHES: BranchRow[] = [
  { id: 1, name: 'DrMayDay Cơ sở Hà Nội', address: '1 Đại Cồ Việt, Hai Bà Trưng, Hà Nội', phone: '0243869999', ...stamp },
  { id: 2, name: 'DrMayDay Cơ sở TP.HCM', address: '215 Hồng Bàng, Quận 5, TP. Hồ Chí Minh', phone: '0283855888', ...stamp },
];

const DEPARTMENTS: DepartmentRow[] = [
  { id: 1, name: 'Khoa Da liễu', description: 'Khám và điều trị bệnh da', branch_id: 1, ...stamp },
  { id: 2, name: 'Khoa Dị ứng – Miễn dịch', description: 'Mề đay, dị ứng', branch_id: 1, ...stamp },
  { id: 3, name: 'Khoa Da liễu', description: 'Khám và điều trị bệnh da', branch_id: 2, ...stamp },
];

const ROOMS: RoomRow[] = [
  { id: 1, name: 'Phòng khám 101', description: null, department_id: 1, ...stamp },
  { id: 2, name: 'Phòng khám 102', description: null, department_id: 1, ...stamp },
  { id: 3, name: 'Phòng khám 201', description: null, department_id: 2, ...stamp },
  { id: 4, name: 'Phòng khám 301', description: null, department_id: 3, ...stamp },
];

type SeedUser = Pick<UserRow, 'user_id' | 'full_name' | 'phone' | 'gender' | 'role_id'> & {
  is_active?: 0 | 1;
  staff?: Omit<StaffRow, 'user_id'>;
  patient?: Partial<PatientRow>;
};

/** Tài khoản mẫu cố định — liệt kê trong README. Mật khẩu: `MOCK_CONFIG.seedPassword`. */
const ACCOUNTS: SeedUser[] = [
  { user_id: 1, full_name: 'Quản Trị Viên', phone: '0900000001', gender: 'male', role_id: ROLE.ADMIN },
  {
    user_id: 2,
    full_name: 'Trần Thị Bình',
    phone: '0911111111',
    gender: 'female',
    role_id: ROLE.DOCTOR,
    staff: { branch_id: 1, department_id: 1, room_id: 1 },
  },
  {
    user_id: 3,
    full_name: 'Lê Văn Cường',
    phone: '0911111112',
    gender: 'male',
    role_id: ROLE.DOCTOR,
    staff: { branch_id: 1, department_id: 2, room_id: 3 },
  },
  {
    user_id: 4,
    full_name: 'Phạm Thị Dung',
    phone: '0922222222',
    gender: 'female',
    role_id: ROLE.NURSE,
    staff: { branch_id: 1, department_id: 1, room_id: null },
  },
  {
    user_id: 5,
    full_name: 'Hoàng Minh Đức',
    phone: '0911111113',
    gender: 'male',
    role_id: ROLE.HEAD_OF_DEPARTMENT,
    staff: { branch_id: 2, department_id: 3, room_id: 4 },
  },
  {
    user_id: 15,
    full_name: 'Nguyễn Văn A',
    phone: '0912345678',
    gender: 'male',
    role_id: ROLE.PATIENT,
    patient: {
      year_of_birth: 1990,
      career: 'Nhân viên văn phòng',
      ethnic: 'Kinh',
      hamlet_address: 'Tổ 5',
      commune_address: 'Phường Bách Khoa',
      city_address: 'Hà Nội',
      work_place: 'Công ty TNHH ABC',
      health_insurance_number: 'DN4010123456789',
      health_insurance_validate: '2027-12-31',
      next_of_kin_name: 'Nguyễn Thị B',
      next_of_kin_phone: '0987654321',
      first_visit: '2026-10-15 08:30:00',
    },
  },
  {
    user_id: 16,
    full_name: 'Đỗ Thị Hoa',
    phone: '0988888888',
    gender: 'female',
    role_id: ROLE.PATIENT,
    is_active: 0,
    patient: { year_of_birth: 1985, city_address: 'Hải Phòng' },
  },
];

// Bệnh nhân sinh tự động (ID 17–40) để có đủ dữ liệu thử phân trang/tìm kiếm.
const LAST_NAMES = ['Nguyễn', 'Trần', 'Lê', 'Phạm', 'Hoàng', 'Vũ', 'Võ', 'Đặng', 'Bùi', 'Đỗ', 'Ngô', 'Dương'];
const MIDDLE_NAMES = { male: ['Văn', 'Minh', 'Quốc', 'Đức', 'Hữu'], female: ['Thị', 'Ngọc', 'Thu', 'Thanh', 'Mai'] };
const FIRST_NAMES = {
  male: ['Anh', 'Bảo', 'Dũng', 'Hải', 'Hùng', 'Khoa', 'Long', 'Nam', 'Phong', 'Quân', 'Sơn', 'Tuấn'],
  female: ['Chi', 'Giang', 'Hà', 'Hạnh', 'Lan', 'Linh', 'My', 'Nga', 'Phương', 'Thảo', 'Trang', 'Yến'],
};
const CITIES = ['Hà Nội', 'TP. Hồ Chí Minh', 'Đà Nẵng', 'Hải Phòng', 'Cần Thơ', 'Nghệ An', 'Thanh Hóa', 'Huế'];

function generatedPatients(): SeedUser[] {
  return Array.from({ length: 24 }, (_, i) => {
    const gender = i % 2 === 0 ? 'female' : 'male';
    const name = `${LAST_NAMES[i % LAST_NAMES.length]} ${MIDDLE_NAMES[gender][i % 5]} ${FIRST_NAMES[gender][(i * 5) % 12]}`;
    const userId = 17 + i;
    return {
      user_id: userId,
      full_name: name,
      phone: `09710000${String(userId).padStart(2, '0')}`,
      gender,
      role_id: ROLE.PATIENT,
      patient: { year_of_birth: 1960 + ((i * 7) % 45), city_address: CITIES[i % CITIES.length] },
    };
  });
}

export function emptyPatient(userId: number, patch: Partial<PatientRow> = {}): PatientRow {
  return {
    user_id: userId,
    year_of_birth: null,
    career: null,
    ethnic: null,
    hamlet_address: null,
    commune_address: null,
    city_address: null,
    work_place: null,
    health_insurance_number: null,
    health_insurance_validate: null,
    next_of_kin_name: null,
    next_of_kin_phone: null,
    first_visit: null,
    ...patch,
  };
}

/** Thời điểm tạo: tài khoản sau tạo muộn hơn tài khoản trước (để sắp xếp "mới nhất" có nghĩa). */
function createdAt(index: number) {
  return toApiDateTime(new Date(2026, 9, 1, 8 + index * 5, 0, 0));
}

export function createSeed(): MockDb {
  const users = new Map<number, UserRow>();
  const patients = new Map<number, PatientRow>();
  const staffs = new Map<number, StaffRow>();

  [...ACCOUNTS, ...generatedPatients()].forEach((seed, index) => {
    const time = createdAt(index);
    users.set(seed.user_id, {
      user_id: seed.user_id,
      full_name: seed.full_name,
      phone: seed.phone,
      password: MOCK_CONFIG.seedPassword,
      gender: seed.gender,
      role_id: seed.role_id,
      is_active: seed.is_active ?? 1,
      token_version: 0,
      reset_otp: null,
      reset_expires_at: null,
      created_at: time,
      updated_at: time,
    });
    if (seed.role_id === ROLE.PATIENT) patients.set(seed.user_id, emptyPatient(seed.user_id, seed.patient));
    if (seed.staff) staffs.set(seed.user_id, { user_id: seed.user_id, ...seed.staff });
  });

  const roles = new Map<number, RoleRow>(
    ROLES.map(([id, name, description, parent]) => [
      id,
      { id, name, description, parent_role_id: parent, created_at: SEED_TIME, updated_at: SEED_TIME },
    ]),
  );
  const permissions = new Map<number, PermissionRow>(
    PERMISSIONS.map(([id, name, description]) => [
      id,
      { id, name, description, created_at: SEED_TIME, updated_at: SEED_TIME },
    ]),
  );
  const rolePermissions: RolePermissionRow[] = Object.entries(ROLE_PERMISSIONS).flatMap(([roleId, permissionIds]) =>
    permissionIds.map((permissionId) => ({ id: 0, role_id: Number(roleId), permission_id: permissionId, created_at: SEED_TIME })),
  );
  // Append grants so all existing role_permission IDs remain stable.
  rolePermissions.push(...Object.keys(ROLE_PERMISSIONS).map((roleId) => ({
    id: 0, role_id: Number(roleId), permission_id: 14, created_at: SEED_TIME,
  })));
  rolePermissions.forEach((row, i) => {
    row.id = i + 1;
  });

  return {
    ...createClinicalSeed(),
    ...createModuleSeed(),
    users,
    patients,
    staffs,
    roles,
    permissions,
    role_permissions: rolePermissions,
    branches: new Map(BRANCHES.map((row) => [row.id, row])),
    departments: new Map(DEPARTMENTS.map((row) => [row.id, row])),
    rooms: new Map(ROOMS.map((row) => [row.id, row])),
    token_blacklist: new Set(),
  };
}
