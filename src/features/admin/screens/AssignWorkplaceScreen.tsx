import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';

import { getErrorMessage } from '@/core/api';
import { AppHeader, Button, Card, ErrorState, Screen, Spinner, Text, toast } from '@/shared/ui';

import { WorkplaceFields, type WorkplaceValue } from '../components/WorkplaceFields';
import { useAssignUser, useUser } from '../hooks/useUsers';
import { isPatientDetail, type Staff } from '../types';

function AssignForm({ staff }: { staff: Staff }) {
  const router = useRouter();
  const assign = useAssignUser(staff.user_id);
  const [value, setValue] = useState<WorkplaceValue>({
    branch_id: staff.branch_id,
    department_id: staff.department_id,
    room_id: staff.room_id,
  });
  const [errors, setErrors] = useState<Partial<Record<keyof WorkplaceValue, string>>>({});

  const submit = () => {
    if (value.branch_id === null || value.department_id === null) {
      setErrors({
        branch_id: value.branch_id === null ? 'Vui lòng chọn chi nhánh' : undefined,
        department_id: value.department_id === null ? 'Vui lòng chọn khoa' : undefined,
      });
      return;
    }
    assign.mutate(
      { branch_id: value.branch_id, department_id: value.department_id, room_id: value.room_id },
      {
        onSuccess: () => {
          toast.success('Đã cập nhật vị trí công tác.');
          router.back();
        },
      },
    );
  };

  return (
    <Screen
      header={<AppHeader title="Phân công công tác" onBack={() => router.canGoBack() ? router.back() : router.replace('/admin/users')} />}
      footer={<Button title="Lưu phân công" fullWidth loading={assign.isPending} onPress={submit} />}>
      <Card className="mb-5">
        <Text variant="caption" tone="muted">
          Nhân viên
        </Text>
        <Text weight="semibold">{staff.full_name}</Text>
      </Card>
      <WorkplaceFields
        value={value}
        onChange={(next) => {
          setValue(next);
          setErrors({});
        }}
        errors={errors}
      />
    </Screen>
  );
}

/** admin06 — Điều chuyển nhân viên sang chi nhánh / khoa / phòng khác. */
export function AssignWorkplaceScreen() {
  const router = useRouter();
  const id = Number(useLocalSearchParams<{ id: string }>().id);
  const { data: user, isLoading, error, refetch } = useUser(id);
  if (user && !isPatientDetail(user)) return <AssignForm staff={user} />;
  return (
    <Screen header={<AppHeader title="Phân công công tác" onBack={() => router.canGoBack() ? router.back() : router.replace('/admin/users')} />}>
      {isLoading ? (
        <Spinner fill />
      ) : (
        <ErrorState
          fill
          description={user ? 'Chỉ phân công được cho nhân viên y tế.' : getErrorMessage(error)}
          onRetry={user ? undefined : () => refetch()}
        />
      )}
    </Screen>
  );
}
