import { z } from 'zod';

import { rules } from '@/shared/form';

/** Chọn bắt buộc một ID (select): form giữ `null` khi chưa chọn. */
const requiredId = (label: string) =>
  z
    .number()
    .nullable()
    .refine((v) => v !== null, `Vui lòng chọn ${label}`)
    .transform((v) => v as number);

const gender = z.enum(['male', 'female', 'other']).nullable();

/** Định danh vai trò/quyền: chữ thường, số, gạch dưới — VD `intern_doctor`, `manage_users`. */
const identifier = (label: string) =>
  rules
    .required(label)
    .regex(/^[a-z][a-z0-9_]*$/, 'Chỉ gồm chữ thường không dấu, số và dấu gạch dưới, bắt đầu bằng chữ');

const workplace = {
  branch_id: requiredId('chi nhánh'),
  department_id: requiredId('khoa'),
  room_id: z.number().nullable(),
};

export const createUserSchema = z.object({
  full_name: rules.required('họ và tên'),
  phone: rules.phone(),
  password: rules.password('mật khẩu khởi tạo'),
  gender,
  role_id: requiredId('vai trò'),
  is_active: z.boolean(),
});

export const createStaffSchema = z.object({
  full_name: rules.required('họ và tên'),
  phone: rules.phone(),
  password: rules.password('mật khẩu khởi tạo'),
  gender,
  role_id: requiredId('vai trò'),
  ...workplace,
});

export const editUserSchema = z.object({
  full_name: rules.required('họ và tên'),
  gender,
  role_id: requiredId('vai trò'),
  is_active: z.boolean(),
});

export const assignWorkplaceSchema = z.object(workplace);

export const roleSchema = z.object({
  name: identifier('tên định danh'),
  description: z.string().trim(),
  parent_role_id: z.number().nullable(),
});

export const permissionSchema = z.object({
  name: identifier('tên định danh'),
  description: z.string().trim(),
});
