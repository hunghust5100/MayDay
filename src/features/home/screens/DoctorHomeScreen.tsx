import { useRouter } from 'expo-router';
import { Bell, ClipboardList, FlaskConical, Images, Inbox, Pill, Search, UserPlus } from 'lucide-react-native';

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
          right={<IconButton icon={Bell} accessibilityLabel="Thông báo" onPress={() => router.push('/doctor/notifications')} />}
        />
      }>
      <ActionBanner
        icon={Inbox}
        title="Bệnh án chờ tiếp nhận"
        description="Xem và tiếp nhận các bệnh án bệnh nhân vừa khai báo."
        actionLabel="Mở danh sách"
        onPress={() => router.push('/doctor/records')}
      />

      <SectionHeader title="Chức năng" className="mb-3 mt-6" />
      <QuickActions
        actions={[
          { label: 'Bệnh án', icon: ClipboardList, tone: 'teal', onPress: () => router.push('/doctor/records') },
          { label: 'Tìm bệnh nhân', icon: Search, tone: 'indigo', onPress: () => router.push('/doctor/patients') },
          { label: 'Thêm bệnh nhân', icon: UserPlus, tone: 'amber', onPress: () => router.push('/doctor/patients/new') },
          { label: 'Kê đơn thuốc', icon: Pill, tone: 'rose', onPress: () => router.push('/doctor/prescriptions') },
          { label: 'Xét nghiệm', icon: FlaskConical, tone: 'amber', onPress: () => router.push('/doctor/labs') },
          { label: 'Kho ảnh', icon: Images, tone: 'teal', onPress: () => router.push('/doctor/media') },
        ]}
      />
    </Screen>
  );
}
