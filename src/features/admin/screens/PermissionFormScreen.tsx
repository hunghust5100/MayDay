import { useLocalSearchParams, useRouter } from 'expo-router';
import { Tag, Trash2 } from 'lucide-react-native';
import { useState } from 'react';
import { View } from 'react-native';

import { applyFieldErrors } from '@/core/api';
import { FormField, TextField, useZodForm } from '@/shared/form';
import { AppHeader, Button, ConfirmDialog, Screen, Spinner, Text, toast } from '@/shared/ui';

import { useCreatePermission, useDeletePermission, useEditPermission, usePermissions } from '../hooks/useRbac';
import { permissionSchema } from '../schemas';
import type { Permission } from '../types';

function PermissionForm({ permission }: { permission?: Permission }) {
  const router = useRouter();
  const isEdit = permission !== undefined;
  const create = useCreatePermission();
  const edit = useEditPermission(permission?.id ?? 0);
  const remove = useDeletePermission();
  const [confirmDelete, setConfirmDelete] = useState(false);
  const form = useZodForm(permissionSchema, {
    defaultValues: { name: permission?.name ?? '', description: permission?.description ?? '' },
  });
  const { control } = form;
  const saving = create.isPending || edit.isPending;

  const submit = form.handleSubmit((values) => {
    const body = { name: values.name, description: values.description || null };
    const onError = (error: unknown) => applyFieldErrors(error, form.setError, { '2003': ['name', 'Tên định danh đã tồn tại'] });
    const onSuccess = () => {
      toast.success(isEdit ? 'Đã cập nhật quyền.' : 'Đã tạo quyền.');
      router.back();
    };
    if (isEdit) edit.mutate(body, { onSuccess, onError });
    else create.mutate(body, { onSuccess, onError });
  });

  return (
    <Screen
      header={<AppHeader title={isEdit ? 'Sửa quyền' : 'Thêm quyền'} onBack={() => router.canGoBack() ? router.back() : router.replace('/admin/rbac')} />}
      footer={<Button title={isEdit ? 'Lưu thay đổi' : 'Tạo quyền'} fullWidth loading={saving} onPress={() => submit()} />}>
      <View className="gap-[18px]">
        <FormField
          control={control}
          name="description"
          render={(field) => <TextField label="Mô tả" placeholder="VD: Quản lý người dùng" {...field} />}
        />
        <FormField
          control={control}
          name="name"
          render={(field) => (
            <TextField
              label="Tên định danh"
              required
              leftIcon={Tag}
              placeholder="VD: manage_users"
              autoCapitalize="none"
              autoCorrect={false}
              {...field}
            />
          )}
        />
        {isEdit && (
          <Button
            title="Xóa quyền"
            variant="danger-soft"
            leftIcon={Trash2}
            fullWidth
            onPress={() => setConfirmDelete(true)}
            className="mt-4"
          />
        )}
      </View>

      <ConfirmDialog
        visible={confirmDelete}
        icon={Trash2}
        destructive
        title="Xóa quyền?"
        description="Mọi vai trò đang có quyền này sẽ tự động mất quyền. Không thể hoàn tác."
        confirmLabel="Xóa"
        loading={remove.isPending}
        onCancel={() => setConfirmDelete(false)}
        onConfirm={() =>
          permission &&
          remove.mutate(permission.id, {
            onSuccess: () => {
              setConfirmDelete(false);
              toast.success('Đã xóa quyền.');
              router.back();
            },
          })
        }
      />
    </Screen>
  );
}

/** perm01 — Thêm quyền. */
export function PermissionCreateScreen() {
  return <PermissionForm />;
}

/** perm03/perm04 — Sửa, xóa quyền (tìm trong danh sách vì API không có chi tiết quyền). */
export function PermissionEditScreen() {
  const router = useRouter();
  const id = Number(useLocalSearchParams<{ id: string }>().id);
  const { data: permissions, isLoading } = usePermissions();
  const permission = permissions?.find((p) => p.id === id);
  if (permission) return <PermissionForm permission={permission} />;
  return (
    <Screen header={<AppHeader title="Sửa quyền" onBack={() => router.canGoBack() ? router.back() : router.replace('/admin/rbac')} />}>
      {isLoading ? (
        <Spinner fill />
      ) : (
        <Text tone="muted" align="center" className="mt-10">
          Không tìm thấy quyền #{id}.
        </Text>
      )}
    </Screen>
  );
}
