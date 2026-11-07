import type { Gender } from '@/shared/types';

// Model theo tài liệu "Xác thực và quản lý tài khoản người dùng" — mục Patient Profile.

/** Hồ sơ bệnh nhân (JOIN `users` + `patients`). */
export type PatientProfile = {
  user_id: number;
  full_name: string;
  phone: string;
  role_id: number;
  is_active: number;
  gender: Gender | null;
  year_of_birth: number | null;
  career: string | null;
  ethnic: string | null;
  hamlet_address: string | null;
  commune_address: string | null;
  city_address: string | null;
  work_place: string | null;
  health_insurance_number: string | null;
  /** `YYYY-MM-DD` */
  health_insurance_validate: string | null;
  next_of_kin_name: string | null;
  next_of_kin_phone: string | null;
  first_visit: string | null;
  created_at: string;
};

/** profile02 — cập nhật một phần (không gồm `phone`, `role_id`, `is_active`). */
export type UpdateProfileRequest = Partial<
  Pick<
    PatientProfile,
    | 'full_name'
    | 'gender'
    | 'year_of_birth'
    | 'career'
    | 'ethnic'
    | 'hamlet_address'
    | 'commune_address'
    | 'city_address'
    | 'work_place'
    | 'health_insurance_number'
    | 'health_insurance_validate'
    | 'next_of_kin_name'
    | 'next_of_kin_phone'
  >
>;
