import { useRouter } from 'expo-router';
import { Pencil } from 'lucide-react-native';
import type { ReactNode } from 'react';
import { View } from 'react-native';

import { getErrorMessage } from '@/core/api';
import { genderLabel } from '@/shared/constants';
import { AppHeader, Avatar, Card, Divider, ErrorState, IconButton, InfoRow, Screen, Skeleton, Text } from '@/shared/ui';
import { formatDate, formatDateTime, formatPhone } from '@/shared/utils';

import { useProfile } from '../hooks/useProfile';

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <>
      <Text variant="label" tone="muted" className="mb-2 mt-6">
        {title}
      </Text>
      <Card className="gap-1 py-2">{children}</Card>
    </>
  );
}

/** profile01 — Bệnh nhân xem hồ sơ cá nhân. */
export function ProfileScreen() {
  const router = useRouter();
  const { data: profile, isLoading, error, refetch } = useProfile();

  return (
    <Screen
      header={
        <AppHeader
          title="Hồ sơ cá nhân"
          onBack={router.back}
          right={
            profile && (
              <IconButton icon={Pencil} accessibilityLabel="Sửa hồ sơ" onPress={() => router.push('/patient/profile/edit')} />
            )
          }
        />
      }>
      {isLoading && (
        <View className="gap-3">
          <Skeleton height={96} />
          <Skeleton height={220} />
        </View>
      )}
      {error && !profile && <ErrorState fill description={getErrorMessage(error)} onRetry={() => refetch()} />}
      {profile && (
        <>
          <Card padding="lg" className="flex-row items-center gap-4">
            <Avatar name={profile.full_name} size="lg" />
            <View className="flex-1 gap-0.5">
              <Text variant="h3">{profile.full_name}</Text>
              <Text variant="caption" tone="muted">
                {formatPhone(profile.phone)}
              </Text>
            </View>
          </Card>

          <Section title="Thông tin cơ bản">
            <InfoRow label="Giới tính" value={genderLabel(profile.gender)} />
            <Divider />
            <InfoRow label="Năm sinh" value={profile.year_of_birth} />
            <Divider />
            <InfoRow label="Dân tộc" value={profile.ethnic} />
            <Divider />
            <InfoRow label="Nghề nghiệp" value={profile.career} />
            <Divider />
            <InfoRow label="Nơi làm việc" value={profile.work_place} />
          </Section>

          <Section title="Địa chỉ">
            <InfoRow label="Thôn / xóm" value={profile.hamlet_address} />
            <Divider />
            <InfoRow label="Xã / phường" value={profile.commune_address} />
            <Divider />
            <InfoRow label="Tỉnh / thành phố" value={profile.city_address} />
          </Section>

          <Section title="Bảo hiểm y tế">
            <InfoRow label="Số thẻ BHYT" value={profile.health_insurance_number} />
            <Divider />
            <InfoRow label="Hạn sử dụng" value={profile.health_insurance_validate && formatDate(profile.health_insurance_validate)} />
          </Section>

          <Section title="Người nhà">
            <InfoRow label="Họ tên" value={profile.next_of_kin_name} />
            <Divider />
            <InfoRow label="Số điện thoại" value={profile.next_of_kin_phone && formatPhone(profile.next_of_kin_phone)} />
          </Section>

          <Text variant="caption" tone="subtle" align="center" className="mt-6">
            Khám lần đầu: {formatDateTime(profile.first_visit)} · Tạo tài khoản: {formatDate(profile.created_at)}
          </Text>
        </>
      )}
    </Screen>
  );
}
