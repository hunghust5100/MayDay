import { useRouter } from 'expo-router';
import { Lock, UserRound } from 'lucide-react-native';
import { useWatch } from 'react-hook-form';
import { View } from 'react-native';

import { applyFieldErrors } from '@/core/api';
import { ROLE_IDS } from '@/core/auth';
import { GENDER_OPTIONS } from '@/shared/constants';
import { FormField, PasswordField, PhoneField, RadioGroup, TextField, useZodForm } from '@/shared/form';
import { AppHeader, Button, Screen, Text, toast } from '@/shared/ui';

import { RoleSelect } from '../components/RoleSelect';
import { WorkplaceFields } from '../components/WorkplaceFields';
import { useCreateStaff } from '../hooks/useUsers';
import { createStaffSchema } from '../schemas';

/** auth07 — Admin tạo tài khoản nhân viên y tế kèm vị trí công tác. */
export function StaffCreateScreen() {
  const router = useRouter();
  const create = useCreateStaff();
  const form = useZodForm(createStaffSchema, {
    defaultValues: {
      full_name: '',
      phone: '',
      password: '',
      gender: null,
      role_id: null,
      branch_id: null,
      department_id: null,
      room_id: null,
    },
  });
  const { control, formState } = form;
  const [branchId, departmentId, roomId] = useWatch({ control, name: ['branch_id', 'department_id', 'room_id'] });

  const submit = form.handleSubmit(({ gender, ...values }) =>
    create.mutate(
      { ...values, gender: gender ?? undefined },
      {
        onSuccess: (staff) => {
          toast.success('Đã thêm nhân viên.');
          router.replace(`/admin/users/${staff.user_id}`);
        },
        onError: (error) =>
          applyFieldErrors(error, form.setError, {
            '2004': ['phone', 'Số điện thoại không hợp lệ'],
            '3006': ['phone', 'Số điện thoại đã được đăng ký'],
            '2003': ['department_id', 'Vị trí công tác không hợp lệ'],
          }),
      },
    ),
  );

  return (
    <Screen
      header={<AppHeader title="Thêm nhân viên y tế" onBack={router.back} />}
      footer={<Button title="Tạo tài khoản nhân viên" fullWidth loading={create.isPending} onPress={() => submit()} />}>
      <View className="gap-[18px] pb-4">
        <Text variant="h3">Tài khoản</Text>
        <FormField
          control={control}
          name="full_name"
          render={(field) => <TextField label="Họ và tên" required leftIcon={UserRound} autoCapitalize="words" {...field} />}
        />
        <FormField control={control} name="phone" render={(field) => <PhoneField label="Số điện thoại" required {...field} />} />
        <FormField
          control={control}
          name="password"
          render={(field) => <PasswordField label="Mật khẩu khởi tạo" required leftIcon={Lock} placeholder="Tối thiểu 6 ký tự" {...field} />}
        />
        <FormField
          control={control}
          name="gender"
          render={({ value, onChange, error }) => (
            <RadioGroup label="Giới tính" direction="row" options={GENDER_OPTIONS} value={value} onChange={onChange} error={error} />
          )}
        />
        <FormField
          control={control}
          name="role_id"
          render={({ value, onChange, error }) => (
            <RoleSelect value={value} onChange={onChange} error={error} exclude={[ROLE_IDS.PATIENT]} />
          )}
        />

        <Text variant="h3" className="mt-2">
          Vị trí công tác
        </Text>
        <WorkplaceFields
          value={{ branch_id: branchId, department_id: departmentId, room_id: roomId }}
          onChange={(next) => {
            const validate = formState.isSubmitted;
            form.setValue('branch_id', next.branch_id, { shouldValidate: validate });
            form.setValue('department_id', next.department_id, { shouldValidate: validate });
            form.setValue('room_id', next.room_id);
          }}
          errors={{ branch_id: formState.errors.branch_id?.message, department_id: formState.errors.department_id?.message }}
        />
      </View>
    </Screen>
  );
}
