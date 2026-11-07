import Constants from 'expo-constants';
import { useRouter } from 'expo-router';
import { KeyRound, LogOut, UserRoundPen } from 'lucide-react-native';
import { useState } from 'react';
import { View } from 'react-native';

import { getRoleGroup, ROLE_GROUP_LABELS, useSession } from '@/core/auth';
import { useLogout } from '@/features/auth';
import { APP_NAME } from '@/shared/constants';
import { Avatar, Badge, Button, Card, ConfirmDialog, Divider, Screen, ScreenTitle, Text } from '@/shared/ui';
import { formatPhone } from '@/shared/utils';

import { MenuItem } from '../components/MenuItem';

/** Tab "Tài khoản" — dùng chung cho bệnh nhân, nhân viên y tế và admin. */
export function AccountScreen() {
  const router = useRouter();
  const auth = useSession();
  const logout = useLogout();
  const [confirming, setConfirming] = useState(false);
  if (auth.status !== 'signedIn') return null;

  const { user } = auth;
  const group = getRoleGroup(user.role_id);

  return (
    <Screen header={<ScreenTitle title="Tài khoản" />}>
      <Card padding="lg" className="flex-row items-center gap-4">
        <Avatar name={user.full_name} size="lg" />
        <View className="flex-1 gap-1">
          <Text variant="h3" numberOfLines={1}>
            {user.full_name}
          </Text>
          <Text variant="caption" tone="muted">
            {formatPhone(user.phone)}
          </Text>
          <Badge label={ROLE_GROUP_LABELS[group]} tone="primary" dot={false} className="mt-1" />
        </View>
      </Card>

      <Text variant="label" tone="muted" className="mb-2 mt-6">
        Cài đặt tài khoản
      </Text>
      <Card padding="none" className="px-4">
        {group === 'patient' && (
          <>
            <MenuItem
              icon={UserRoundPen}
              title="Hồ sơ cá nhân"
              description="Thông tin hành chính, BHYT, người nhà"
              onPress={() => router.push('/patient/profile')}
            />
            <Divider />
          </>
        )}
        <MenuItem icon={KeyRound} title="Đổi mật khẩu" onPress={() => router.push('/change-password')} />
      </Card>

      <Button
        title="Đăng xuất"
        variant="outline"
        leftIcon={LogOut}
        fullWidth
        onPress={() => setConfirming(true)}
        className="mt-6"
      />
      <Text variant="tiny" tone="subtle" align="center" className="mt-4">
        {APP_NAME} · Phiên bản {Constants.expoConfig?.version ?? '1.0.0'}
      </Text>

      <ConfirmDialog
        visible={confirming}
        icon={LogOut}
        title="Đăng xuất?"
        description="Bạn sẽ cần đăng nhập lại để tiếp tục sử dụng ứng dụng."
        confirmLabel="Đăng xuất"
        loading={logout.isPending}
        onCancel={() => setConfirming(false)}
        onConfirm={() => logout.mutate()}
      />
    </Screen>
  );
}
