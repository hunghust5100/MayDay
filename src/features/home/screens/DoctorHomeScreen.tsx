import { useRouter } from 'expo-router';
import { View } from 'react-native';
import {
  Bell,
  ClipboardList,
  FlaskConical,
  Images,
  Inbox,
  Pill,
  Search,
  UserPlus,
} from 'lucide-react-native';

import { getRoleGroup, ROLE_GROUP_LABELS, useSession } from '@/core/auth';
import { IconButton, Screen, ScreenTitle, SectionHeader } from '@/shared/ui';
import { formatDayLabel } from '@/shared/utils';

import { ActionBanner } from '../components/ActionBanner';
import { QuickActions } from '../components/QuickActions';

/** Trang chủ nhân viên y tế (bác sĩ, điều dưỡng…). */
export function DoctorHomeScreen() {
  const router = useRouter();
  const auth = useSession();
  const user = auth.status === 'signedIn' ? auth.user : null;

  return (
    <Screen
      header={
        <ScreenTitle
          eyebrow={`${user ? ROLE_GROUP_LABELS[getRoleGroup(user.role_id)] : ''} · ${formatDayLabel(new Date())}`}
          title={`Xin chào, ${user?.display_name ?? ''}`}
          right={
            <IconButton
              icon={Bell}
              accessibilityLabel="Thông báo"
              onPress={() => router.push('/doctor/notifications')}
            />
          }
        />
      }
    >
      <View className="gap-4 lg:flex-row lg:items-start lg:gap-6">
        <View className="min-w-0 lg:flex-1">
          <ActionBanner
            icon={Inbox}
            title="Bệnh án chờ tiếp nhận"
            description="Xem các bệnh án mới."
            actionLabel="Xem bệnh án chờ"
            onPress={() => router.push({ pathname: '/doctor/records', params: { status: 'pending' } })}
          />
        </View>
        <View className="min-w-0 lg:flex-1">
          <SectionHeader title="Công việc" className="mb-2 mt-0" />
          <QuickActions
            actions={[
              {
                label: 'Mọi bệnh án',
                icon: ClipboardList,
                onPress: () => router.push({ pathname: '/doctor/records', params: { status: 'all' } }),
              },
              { label: 'Tìm bệnh nhân', icon: Search, onPress: () => router.push('/doctor/patients') },
              { label: 'Thêm bệnh nhân', icon: UserPlus, onPress: () => router.push('/doctor/patients/new') },
              { label: 'Kê đơn thuốc', icon: Pill, onPress: () => router.push('/doctor/prescriptions') },
              { label: 'Xét nghiệm', icon: FlaskConical, onPress: () => router.push('/doctor/labs') },
              { label: 'Kho ảnh', icon: Images, onPress: () => router.push('/doctor/media') },
            ]}
          />
        </View>
      </View>
    </Screen>
  );
}
