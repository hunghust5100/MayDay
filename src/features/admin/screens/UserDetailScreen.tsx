import { useLocalSearchParams, useRouter } from 'expo-router';
import { Lock, LockOpen, MapPinned, Pencil, Trash2 } from 'lucide-react-native';
import { useState, type ReactNode } from 'react';
import { View } from 'react-native';

import { getErrorMessage } from '@/core/api';
import { useSession } from '@/core/auth';
import type { PatientProfile } from '@/features/profile';
import { genderLabel } from '@/shared/constants';
import {
  AppHeader,
  Avatar,
  Badge,
  Button,
  Card,
  ConfirmDialog,
  Divider,
  ErrorState,
  IconButton,
  InfoRow,
  Screen,
  Spinner,
  Text,
  toast,
} from '@/shared/ui';
import { formatDate, formatDateTime, formatPhone } from '@/shared/utils';

import { useWorkplaceText } from '../components/WorkplaceText';
import { useRoleLabel } from '../hooks/useRbac';
import { useDeleteUser, useEditUser, useUser } from '../hooks/useUsers';
import { isPatientDetail, type Staff } from '../types';

function Section({ title, children, action }: { title: string; children: ReactNode; action?: ReactNode }) {
  return (
    <>
      <Text variant="label" tone="muted" className="mb-2 mt-6">
        {title}
      </Text>
      <Card className="gap-1 py-2">
        {children}
        {action}
      </Card>
    </>
  );
}

function PatientInfo({ profile }: { profile: PatientProfile }) {
  const address = [profile.hamlet_address, profile.commune_address, profile.city_address].filter(Boolean).join(', ');
  return (
    <Section title="Hồ sơ bệnh nhân">
      <InfoRow label="Giới tính" value={genderLabel(profile.gender)} />
      <Divider />
      <InfoRow label="Năm sinh" value={profile.year_of_birth} />
      <Divider />
      <InfoRow label="Nghề nghiệp" value={profile.career} />
      <Divider />
      <InfoRow label="Địa chỉ" value={address} layout="stacked" />
      <Divider />
      <InfoRow label="Số thẻ BHYT" value={profile.health_insurance_number} />
      <Divider />
      <InfoRow label="Người nhà" value={profile.next_of_kin_name && `${profile.next_of_kin_name} · ${formatPhone(profile.next_of_kin_phone)}`} />
      <Divider />
      <InfoRow label="Khám lần đầu" value={profile.first_visit && formatDateTime(profile.first_visit)} />
    </Section>
  );
}

function StaffInfo({ staff, onAssign }: { staff: Staff; onAssign: () => void }) {
  const workplace = useWorkplaceText(staff.branch_id, staff.department_id, staff.room_id);
  return (
    <>
      <Section
        title="Vị trí công tác"
        action={<Button title="Phân công công tác" variant="soft" size="sm" leftIcon={MapPinned} fullWidth onPress={onAssign} className="my-2" />}>
        {workplace ? (
          <>
            <InfoRow label="Chi nhánh" value={workplace.branch} />
            <Divider />
            <InfoRow label="Khoa" value={workplace.department} />
            <Divider />
            <InfoRow label="Phòng" value={workplace.room ?? 'Không cố định'} />
          </>
        ) : (
          <Text tone="muted" className="py-2">
            Chưa được phân công vị trí công tác.
          </Text>
        )}
      </Section>
      <Section title="Thông tin">
        <InfoRow label="Giới tính" value={genderLabel(staff.gender)} />
      </Section>
    </>
  );
}

/** admin03 — Chi tiết người dùng + khóa/mở khóa (admin04), xóa (admin05). */
export function UserDetailScreen() {
  const router = useRouter();
  const id = Number(useLocalSearchParams<{ id: string }>().id);
  const auth = useSession();
  const roleLabel = useRoleLabel();
  const { data: user, isLoading, error, refetch } = useUser(id);
  const edit = useEditUser(id);
  const remove = useDeleteUser();
  const [dialog, setDialog] = useState<'lock' | 'delete' | null>(null);

  const isSelf = auth.status === 'signedIn' && auth.user.user_id === id;
  const locked = user?.is_active !== 1;

  const toggleLock = () =>
    edit.mutate(
      { is_active: locked ? 1 : 0 },
      {
        onSuccess: () => {
          setDialog(null);
          toast.success(locked ? 'Đã mở khóa tài khoản.' : 'Đã khóa tài khoản.');
        },
      },
    );

  const deleteUser = () =>
    remove.mutate(id, {
      onSuccess: () => {
        setDialog(null);
        toast.success('Đã xóa người dùng.');
        router.back();
      },
    });

  return (
    <Screen
      header={
        <AppHeader
          title="Chi tiết người dùng"
          onBack={router.back}
          right={user && <IconButton icon={Pencil} accessibilityLabel="Sửa" onPress={() => router.push(`/admin/users/${id}/edit`)} />}
        />
      }>
      {isLoading && <Spinner fill />}
      {error && !user && <ErrorState fill description={getErrorMessage(error)} onRetry={() => refetch()} />}
      {user && (
        <>
          <Card padding="lg" className="items-center gap-2">
            <Avatar name={user.full_name} size="lg" />
            <Text variant="h2" align="center" className="mt-1">
              {user.full_name}
            </Text>
            <Text tone="muted">{formatPhone(user.phone)}</Text>
            <View className="mt-1 flex-row flex-wrap justify-center gap-2">
              <Badge label={roleLabel(user.role_id)} tone="primary" dot={false} />
              <Badge label={locked ? 'Đã khóa' : 'Đang hoạt động'} tone={locked ? 'danger' : 'success'} />
            </View>
            <Text variant="caption" tone="subtle" className="mt-1">
              Mã #{user.user_id} · Tạo ngày {formatDate(user.created_at)}
            </Text>
          </Card>

          {isPatientDetail(user) ? (
            <PatientInfo profile={user} />
          ) : (
            <StaffInfo staff={user} onAssign={() => router.push(`/admin/users/${id}/assign`)} />
          )}

          {isSelf ? (
            <Text variant="caption" tone="muted" align="center" className="mt-6">
              Đây là tài khoản của bạn — không thể tự khóa hoặc xóa.
            </Text>
          ) : (
            <View className="mt-6 gap-3">
              <Button
                title={locked ? 'Mở khóa tài khoản' : 'Khóa tài khoản'}
                variant="outline"
                leftIcon={locked ? LockOpen : Lock}
                fullWidth
                onPress={() => setDialog('lock')}
              />
              <Button title="Xóa người dùng" variant="danger-soft" leftIcon={Trash2} fullWidth onPress={() => setDialog('delete')} />
            </View>
          )}

          <ConfirmDialog
            visible={dialog === 'lock'}
            icon={locked ? LockOpen : Lock}
            destructive={!locked}
            title={locked ? 'Mở khóa tài khoản?' : 'Khóa tài khoản?'}
            description={
              locked
                ? `${user.full_name} sẽ đăng nhập lại được.`
                : `${user.full_name} sẽ không đăng nhập được cho đến khi được mở khóa.`
            }
            confirmLabel={locked ? 'Mở khóa' : 'Khóa'}
            loading={edit.isPending}
            onCancel={() => setDialog(null)}
            onConfirm={toggleLock}
          />
          <ConfirmDialog
            visible={dialog === 'delete'}
            icon={Trash2}
            destructive
            title="Xóa người dùng?"
            description={`Xóa vĩnh viễn tài khoản ${user.full_name}. Các bệnh án liên quan vẫn được giữ lại.`}
            confirmLabel="Xóa"
            loading={remove.isPending}
            onCancel={() => setDialog(null)}
            onConfirm={deleteUser}
          />
        </>
      )}
    </Screen>
  );
}
