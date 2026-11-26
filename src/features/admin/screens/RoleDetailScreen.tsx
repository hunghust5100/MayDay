import { useLocalSearchParams, useRouter } from 'expo-router';
import { KeyRound, Plus, X } from 'lucide-react-native';
import { Fragment, useState } from 'react';
import { ScrollView, View } from 'react-native';

import { getErrorMessage } from '@/core/api';
import { CheckboxGroup } from '@/shared/form';
import {
  AppHeader,
  BottomSheet,
  Button,
  Card,
  ConfirmDialog,
  Divider,
  EmptyState,
  ErrorState,
  IconButton,
  InfoRow,
  ListItem,
  Screen,
  SectionHeader,
  Spinner,
  Text,
  toast,
} from '@/shared/ui';
import { formatDate } from '@/shared/utils';

import {
  roleTitle,
  useAssignPermissions,
  usePermissions,
  useRevokePermission,
  useRolePermissions,
  useRoles,
} from '../hooks/useRbac';
import type { RolePermission } from '../types';

function AssignSheet({ roleId, assigned, visible, onClose }: { roleId: number; assigned: number[]; visible: boolean; onClose: () => void }) {
  const { data: permissions = [] } = usePermissions();
  const assign = useAssignPermissions(roleId);
  const [selected, setSelected] = useState<number[]>([]);
  const available = permissions.filter((p) => !assigned.includes(p.id));

  const close = () => {
    setSelected([]);
    onClose();
  };

  return (
    <BottomSheet visible={visible} onClose={close} title="Cấp quyền" fixedHeight>
      {available.length === 0 ? (
        <EmptyState icon={KeyRound} title="Vai trò đã có tất cả các quyền" className="py-8" />
      ) : (
        <View className="min-h-0 flex-1 gap-3">
          {/* Danh sách dài thì cuộn trong sheet, nút xác nhận luôn hiển thị */}
          <ScrollView className="min-h-0 flex-1" keyboardShouldPersistTaps="handled">
            <CheckboxGroup
              options={available.map((p) => ({ value: p.id, label: p.description || p.name }))}
              value={selected}
              onChange={setSelected}
            />
          </ScrollView>
          <Button
            title={selected.length ? `Cấp ${selected.length} quyền` : 'Chọn quyền để cấp'}
            fullWidth
            disabled={selected.length === 0}
            loading={assign.isPending}
            onPress={() =>
              assign.mutate(selected, {
                onSuccess: (result) => {
                  toast.success(`Đã cấp ${result.added_count} quyền.`);
                  close();
                },
              })
            }
          />
        </View>
      )}
    </BottomSheet>
  );
}

/** roleperm01–03 — Xem quyền của vai trò, cấp thêm, thu hồi. */
export function RoleDetailScreen() {
  const router = useRouter();
  const id = Number(useLocalSearchParams<{ id: string }>().id);
  const { data: roles } = useRoles();
  const { data: granted, isLoading, error, refetch } = useRolePermissions(id);
  const revoke = useRevokePermission(id);
  const [assigning, setAssigning] = useState(false);
  const [revoking, setRevoking] = useState<RolePermission | null>(null);

  const role = roles?.find((r) => r.id === id);
  const parent = role?.parent_role_id == null ? undefined : roles?.find((r) => r.id === role.parent_role_id);
  const children = roles?.filter((r) => r.parent_role_id === id) ?? [];

  return (
    <Screen header={<AppHeader title={role ? roleTitle(role) : 'Vai trò'} onBack={() => router.canGoBack() ? router.back() : router.replace('/admin/rbac')} />}>
      {role && (
        <Card className="gap-1 py-2">
          <InfoRow label="Tên định danh" value={role.name} />
          <Divider />
          <InfoRow label="Vai trò cha" value={parent && roleTitle(parent)} />
          <Divider />
          <InfoRow label="Vai trò con" value={children.length ? children.map(roleTitle).join(', ') : undefined} />
        </Card>
      )}

      <SectionHeader
        title={`Quyền đã cấp${granted ? ` (${granted.length})` : ''}`}
        className="mb-2 mt-6"
      />
      {isLoading && <Spinner className="mt-6" />}
      {error && !granted && <ErrorState description={getErrorMessage(error)} onRetry={() => refetch()} />}
      {granted?.length === 0 && (
        <EmptyState
          icon={KeyRound}
          title="Vai trò chưa có quyền nào"
          actionLabel="Cấp quyền"
          onAction={() => setAssigning(true)}
        />
      )}
      {granted && granted.length > 0 && (
        <Card padding="none" className="px-4">
          {granted.map((permission, index) => (
            <Fragment key={permission.role_permission_id}>
              {index > 0 && <Divider />}
              <ListItem
                title={permission.description || permission.name}
                description={`Cấp ngày ${formatDate(permission.assigned_at)}`}
                trailing={
                  <IconButton icon={X} variant="ghost" accessibilityLabel={`Thu hồi ${permission.name}`} onPress={() => setRevoking(permission)} />
                }
              />
            </Fragment>
          ))}
        </Card>
      )}
      {granted && granted.length > 0 && (
        <Button title="Cấp thêm quyền" variant="soft" leftIcon={Plus} fullWidth onPress={() => setAssigning(true)} className="mt-4" />
      )}
      {!role && roles && (
        <Text tone="muted" align="center" className="mt-6">
          Không tìm thấy vai trò #{id}.
        </Text>
      )}

      <AssignSheet roleId={id} assigned={granted?.map((p) => p.permission_id) ?? []} visible={assigning} onClose={() => setAssigning(false)} />
      <ConfirmDialog
        visible={revoking !== null}
        icon={X}
        destructive
        title="Thu hồi quyền?"
        description={revoking ? `Vai trò sẽ mất quyền “${revoking.description || revoking.name}”.` : undefined}
        confirmLabel="Thu hồi"
        loading={revoke.isPending}
        onCancel={() => setRevoking(null)}
        onConfirm={() =>
          revoking &&
          revoke.mutate(revoking.permission_id, {
            onSuccess: () => {
              toast.success('Đã thu hồi quyền.');
              setRevoking(null);
            },
          })
        }
      />
    </Screen>
  );
}
