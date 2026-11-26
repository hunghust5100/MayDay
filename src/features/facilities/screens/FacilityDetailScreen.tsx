import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';
import { FormField, SelectField, TextField, useZodForm } from '@/shared/form';
import {
  AppHeader,
  Button,
  Card,
  ConfirmDialog,
  Divider,
  EmptyState,
  ErrorState,
  InfoRow,
  Screen,
  Spinner,
  Text,
  toast,
} from '@/shared/ui';
import { formatDateTime, formatPhone } from '@/shared/utils';
import { facilityLabels, isFacilityKind, type Facility, type FacilityKind } from '../api/management-api';
import { useBranches, useDepartments } from '../hooks/useFacilities';
import { useFacility, useFacilityMutation } from '../hooks/useFacilityManagement';
import { facilitySchema } from '../schemas';

function FacilityForm({ kind, row }: { kind: FacilityKind; row?: Facility }) {
  const router = useRouter();
  const [editing, setEditing] = useState(!row);
  const [confirm, setConfirm] = useState(false);
  const { save, remove } = useFacilityMutation(kind, row?.id);
  const branches = useBranches();
  const departments = useDepartments();
  const form = useZodForm(facilitySchema(kind), {
    defaultValues: {
      name: row?.name ?? '',
      address: row && 'address' in row ? row.address : '',
      phone: row && 'phone' in row ? row.phone : '',
      description: row && 'description' in row ? (row.description ?? '') : '',
      parentId: row && 'branch_id' in row ? row.branch_id : row && 'department_id' in row ? row.department_id : null,
    },
  });
  const submit = form.handleSubmit(({ name, address, phone, description, parentId }) =>
    save.mutate(
      {
        name,
        ...(kind === 'branches'
          ? { address, phone }
          : {
              description: description || null,
              ...(kind === 'departments' ? { branch_id: parentId! } : { department_id: parentId! }),
            }),
      },
      {
        onSuccess: (result) => {
          toast.success('Đã lưu thông tin cơ sở.');
          if (!row) router.replace(`/admin/facilities/${kind}/${result.id}`);
          else setEditing(false);
        },
      },
    ),
  );
  return (
    <Screen header={<AppHeader title={`${row ? '' : 'Thêm '}${facilityLabels[kind]}`} onBack={() => router.canGoBack() ? router.back() : router.replace('/admin/facilities')} />}>
      <View className="gap-3 roomy:gap-4">
        {!editing && row ? (
          <>
            <Card padding="lg" className="gap-1">
              <Text variant="h2" className="mb-2">
                {row.name}
              </Text>
              {'address' in row && (
                <>
                  <InfoRow label="Địa chỉ" value={row.address} layout="stacked" />
                  <Divider />
                  <InfoRow label="Điện thoại" value={formatPhone(row.phone)} />
                </>
              )}
              {'description' in row && (
                <>
                  <InfoRow label="Mô tả" value={row.description} layout="stacked" />
                  <Divider />
                </>
              )}
              {'branch_id' in row && (
                <InfoRow
                  label="Chi nhánh"
                  value={branches.data?.find((b) => b.id === row.branch_id)?.name ?? `#${row.branch_id}`}
                />
              )}
              {'department_id' in row && (
                <InfoRow
                  label="Khoa"
                  value={
                    row.department_id === null
                      ? 'Chưa thuộc khoa'
                      : (departments.data?.find((d) => d.id === row.department_id)?.name ?? `#${row.department_id}`)
                  }
                />
              )}
              <Divider />
              <InfoRow label="Cập nhật" value={formatDateTime(row.updated_at)} />
            </Card>
            <Button title="Chỉnh sửa" onPress={() => setEditing(true)} />
            <Button title="Xóa" variant="danger" onPress={() => setConfirm(true)} />
          </>
        ) : (
          <>
            <FormField
              control={form.control}
              name="name"
              render={(field) => <TextField label="Tên" required {...field} />}
            />
            {kind === 'branches' ? (
              <>
                <FormField
                  control={form.control}
                  name="address"
                  render={(field) => <TextField label="Địa chỉ" required {...field} />}
                />
                <FormField
                  control={form.control}
                  name="phone"
                  render={(field) => (
                    <TextField label="Điện thoại liên hệ" keyboardType="phone-pad" required {...field} />
                  )}
                />
              </>
            ) : (
              <>
                <FormField
                  control={form.control}
                  name="description"
                  render={(field) => <TextField label="Mô tả" multiline {...field} />}
                />
                <FormField
                  control={form.control}
                  name="parentId"
                  render={({ value, onChange, error }) => (
                    <SelectField
                      label={kind === 'departments' ? 'Chi nhánh' : 'Khoa'}
                      required
                      value={value}
                      onChange={onChange}
                      error={error}
                      options={(kind === 'departments' ? (branches.data ?? []) : (departments.data ?? [])).map((p) => ({
                        value: p.id,
                        label: `${p.name}${'branch_id' in p ? ` · ${branches.data?.find((b) => b.id === p.branch_id)?.name ?? p.branch_id}` : ''}`,
                      }))}
                    />
                  )}
                />
                {(branches.isError || departments.isError) && (
                  <ErrorState
                    onRetry={() => {
                      branches.refetch();
                      departments.refetch();
                    }}
                  />
                )}
              </>
            )}
            <Button title="Lưu" loading={save.isPending} onPress={() => submit()} />
            {row && (
              <Button
                title="Hủy sửa"
                variant="ghost"
                disabled={save.isPending}
                onPress={() => {
                  form.reset();
                  setEditing(false);
                }}
              />
            )}
          </>
        )}
      </View>
      <ConfirmDialog
        visible={confirm}
        title={`Xóa ${facilityLabels[kind].toLowerCase()}?`}
        description={
          kind === 'departments'
            ? 'Các phòng trực thuộc sẽ được giữ lại và chuyển thành chưa thuộc khoa.'
            : 'Không thể xóa nếu vẫn còn dữ liệu trực thuộc hoặc nhân viên được phân công.'
        }
        destructive
        loading={remove.isPending}
        onCancel={() => setConfirm(false)}
        onConfirm={() =>
          remove.mutate(undefined, {
            onSuccess: () => {
              toast.success('Đã xóa.');
              router.back();
            },
          })
        }
      />
    </Screen>
  );
}
function ExistingFacility({ kind, id }: { kind: FacilityKind; id: number }) {
  const query = useFacility(kind, id);
  const router = useRouter();
  if (query.isLoading || query.isError)
    return (
      <Screen header={<AppHeader title={facilityLabels[kind]} onBack={() => router.canGoBack() ? router.back() : router.replace('/admin/facilities')} />}>
        {query.isLoading ? <Spinner /> : <ErrorState onRetry={() => query.refetch()} />}
      </Screen>
    );
  return query.data ? (
    <FacilityForm key={`${kind}-${id}-${query.data.updated_at}`} kind={kind} row={query.data} />
  ) : (
    <EmptyState title="Không tìm thấy" />
  );
}
export function FacilityDetailScreen() {
  const { kind, id } = useLocalSearchParams<{ kind: string; id: string }>();
  if (!isFacilityKind(kind) || (id !== 'new' && !/^[1-9]\d*$/.test(id ?? '')))
    return (
      <Screen>
        <EmptyState title="Đường dẫn không hợp lệ" />
      </Screen>
    );
  return id === 'new' ? <FacilityForm key={kind} kind={kind} /> : <ExistingFacility kind={kind} id={Number(id)} />;
}
