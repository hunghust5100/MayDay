import { z } from 'zod';
import { rules } from '@/shared/form';
import { isValidPhone } from '@/shared/utils';
export const patientSchema = z.object({
  full_name: rules.required('họ và tên'),
  phone: rules.phone(),
  password: rules.password('mật khẩu khởi tạo'),
  gender: z.enum(['male', 'female', 'other']).nullable(),
  year_of_birth: rules.yearOfBirth().nullable(),
  career: z.string().trim(),
  ethnic: z.string().trim(),
  hamlet_address: z.string().trim(),
  commune_address: z.string().trim(),
  city_address: z.string().trim(),
  work_place: z.string().trim(),
  health_insurance_number: z.string().trim(),
  health_insurance_validate: rules.date().nullable(),
  next_of_kin_name: z.string().trim(),
  next_of_kin_phone: z
    .string()
    .trim()
    .refine((v) => !v || isValidPhone(v), 'Số điện thoại không hợp lệ'),
});
export const patientFilterSchema = z
  .object({
    min_year: rules.yearOfBirth().nullable(),
    max_year: rules.yearOfBirth().nullable(),
  })
  .refine((v) => v.min_year == null || v.max_year == null || v.min_year <= v.max_year, {
    message: 'Năm bắt đầu phải nhỏ hơn hoặc bằng năm kết thúc',
    path: ['max_year'],
  });
