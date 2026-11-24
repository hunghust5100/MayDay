import { useRouter } from 'expo-router';
import { Tag } from 'lucide-react-native';
import { View } from 'react-native';

import { applyFieldErrors } from '@/core/api';
import { FormField, SelectField, TextField, useZodForm } from '@/shared/form';
import { AppHeader, Button, Screen, toast } from '@/shared/ui';

import { roleTitle, useCreateRole, useRoles } from '../hooks/useRbac';
import { roleSchema } from '../schemas';

/** role01 — Tạo vai trò (có thể đặt vai trò cha để dựng cây tổ chức). */
export function RoleCreateScreen() {
  const router = useRouter();
  const create = useCreateRole();
  const { data: roles = [] } = useRoles();
  const form = useZodForm(roleSchema, { defaultValues: { name: '', description: '', parent_role_id: null } });
  const { control } = form;

  const submit = form.handleSubmit(({ description, parent_role_id, ...values }) =>
    create.mutate(
      { ...values, description: description || undefined, parent_role_id: parent_role_id ?? undefined },
      {
        onSuccess: (role) => {
          toast.success('Đã tạo vai trò.');
          router.replace(`/admin/roles/${role.id}`);
        },
        onError: (error) => applyFieldErrors(error, form.setError, { '2003': ['name', 'Tên định danh đã tồn tại'] }),
      },
    ),
  );

  return (
    <Screen
      header={<AppHeader title="Thêm vai trò" onBack={() => router.canGoBack() ? router.back() : router.replace('/admin/rbac')} />}
      footer={<Button title="Tạo vai trò" fullWidth loading={create.isPending} onPress={() => submit()} />}>
      <View className="gap-[18px]">
        <FormField
          control={control}
          name="description"
          render={(field) => <TextField label="Tên hiển thị" placeholder="VD: Bác sĩ thực tập" {...field} />}
        />
        <FormField
          control={control}
          name="name"
          render={(field) => (
            <TextField
              label="Tên định danh"
              required
              leftIcon={Tag}
              placeholder="VD: intern_doctor"
              hint="Mã vai trò phải là duy nhất."
              autoCapitalize="none"
              autoCorrect={false}
              {...field}
            />
          )}
        />
        <FormField
          control={control}
          name="parent_role_id"
          render={({ value, onChange, error }) => (
            <SelectField
              label="Vai trò cha"
              hint="Không bắt buộc — VD Bác sĩ thực tập thuộc Bác sĩ"
              placeholder="Không có"
              options={roles.map((r) => ({ value: r.id, label: roleTitle(r), description: r.name }))}
              value={value}
              onChange={onChange}
              error={error}
            />
          )}
        />
      </View>
    </Screen>
  );
}
