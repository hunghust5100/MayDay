import { z } from 'zod';

import { rules } from '@/shared/form';

const confirmPassword = z.string().min(1, 'Vui lòng nhập lại mật khẩu');
const MISMATCH = 'Mật khẩu nhập lại không khớp';

export const loginSchema = z.object({
  phone: rules.phone(),
  password: z.string().min(1, 'Vui lòng nhập mật khẩu'),
  remember: z.boolean(),
});

export const signupSchema = z
  .object({
    full_name: rules.required('họ và tên'),
    phone: rules.phone(),
    password: rules.password(),
    confirm_password: confirmPassword,
    gender: z.enum(['male', 'female', 'other']).nullable(),
    year_of_birth: rules.yearOfBirth().nullable(),
  })
  .refine((v) => v.password === v.confirm_password, { path: ['confirm_password'], message: MISMATCH });

export const forgotPasswordSchema = z.object({ phone: rules.phone() });

export const resetPasswordSchema = z
  .object({
    otp: rules.otp(6),
    new_password: rules.password('mật khẩu mới'),
    confirm_password: confirmPassword,
  })
  .refine((v) => v.new_password === v.confirm_password, { path: ['confirm_password'], message: MISMATCH });

export const changePasswordSchema = z
  .object({
    old_password: z.string().min(1, 'Vui lòng nhập mật khẩu hiện tại'),
    new_password: rules.password('mật khẩu mới'),
    confirm_password: confirmPassword,
  })
  .refine((v) => v.new_password === v.confirm_password, { path: ['confirm_password'], message: MISMATCH })
  .refine((v) => v.new_password !== v.old_password, {
    path: ['new_password'],
    message: 'Mật khẩu mới phải khác mật khẩu hiện tại',
  });
