import { useRouter } from 'expo-router';
import {
  Activity,
  Bell,
  ClipboardPlus,
  FlaskConical,
  Images,
  Pill,
  ScanFace,
  UserRoundPen,
} from 'lucide-react-native';

import { View } from 'react-native';
import { useSession } from '@/core/auth';
import { useRecords } from '@/features/medical-records';
import {
  Card,
  IconButton,
  ListItem,
  Screen,
  ScreenTitle,
  SectionHeader,
  StatusBadge,
  Text,
} from '@/shared/ui';
import { formatDateTime, formatDayLabel } from '@/shared/utils';

import { ActionBanner } from '../components/ActionBanner';
import { QuickActions } from '../components/QuickActions';

/** Trang chủ bệnh nhân — lối vào các chức năng. */
export function PatientHomeScreen() {
  const router = useRouter();
  const auth = useSession();
  const user = auth.status === 'signedIn' ? auth.user : null;
  const records = useRecords({}, user?.user_id, Boolean(user));
  const latest = records.items[0];

  return (
    <Screen
      header={
        <ScreenTitle
          eyebrow={formatDayLabel(new Date())}
          title={user?.display_name ? `Xin chào, ${user.display_name}` : 'Trang chủ'}
          right={
            <IconButton
              icon={Bell}
              accessibilityLabel="Thông báo"
              onPress={() => router.push('/patient/notifications')}
            />
          }
        />
      }
    >
      <View className="gap-4 lg:flex-row lg:items-start lg:gap-6">
        <View className="min-w-0 gap-4 lg:flex-1">
          <ActionBanner
            icon={Activity}
            title="Chấm điểm UAS7 hôm nay"
            description="Ghi điểm ngứa và số nốt sẩn."
            actionLabel="Chấm điểm ngay"
            onPress={() => router.push('/patient/uas7')}
          />
          <View>
            <SectionHeader
              title="Bệnh án gần nhất"
              actionLabel="Xem tất cả"
              onAction={() => router.push('/patient/records')}
              className="mb-2 mt-0"
            />
            <Card padding="none" className="px-3">
              {latest ? (
                <ListItem
                  title={`Bệnh án #${latest.medical_record_id}`}
                  description={formatDateTime(latest.created_at)}
                  trailing={<StatusBadge status={latest.status} />}
                  onPress={() => router.push(`/patient/records/${latest.medical_record_id}`)}
                  chevron={false}
                />
              ) : (
                <Text tone="muted" className="py-3">
                  {records.isPending
                    ? 'Đang tải…'
                    : records.isError
                      ? 'Chưa tải được bệnh án.'
                      : 'Bạn chưa có bệnh án.'}
                </Text>
              )}
            </Card>
          </View>
        </View>
        <View className="min-w-0 lg:flex-1">
          <SectionHeader title="Truy cập nhanh" className="mb-2 mt-0" />
          <QuickActions
            actions={[
              {
                label: 'Khai báo bệnh án',
                icon: ClipboardPlus,
                onPress: () => router.push('/patient/records/new'),
              },
              {
                label: 'Ghi nhận tổn thương',
                icon: ScanFace,
                onPress: () => router.push('/patient/lesions'),
              },
              { label: 'Đơn thuốc', icon: Pill, onPress: () => router.push('/patient/prescriptions') },
              { label: 'Xét nghiệm', icon: FlaskConical, onPress: () => router.push('/patient/labs') },
              { label: 'Kho ảnh', icon: Images, onPress: () => router.push('/patient/media') },
              { label: 'Hồ sơ cá nhân', icon: UserRoundPen, onPress: () => router.push('/patient/profile') },
            ]}
          />
        </View>
      </View>
    </Screen>
  );
}
