import { useRouter } from 'expo-router';
import {
  BriefcaseMedical,
  Building2,
  FileText,
  Lock,
  ShieldCheck,
  UserPlus,
  UserRound,
  UsersRound,
} from 'lucide-react-native';
import { View } from 'react-native';

import { useUserStats } from '@/features/admin';
import { Screen, ScreenTitle, SectionHeader, StatCard } from '@/shared/ui';
import { formatDayLabel } from '@/shared/utils';

import { QuickActions } from '../components/QuickActions';

/** Trang chủ admin — số liệu tài khoản + lối tắt quản trị. */
export function AdminHomeScreen() {
  const router = useRouter();
  const { data: stats } = useUserStats();
  const value = (n: number | undefined) => (n === undefined ? '–' : n);
  const toUsers = () => router.push('/admin/users');

  return (
    <Screen header={<ScreenTitle eyebrow={formatDayLabel(new Date())} title="Quản trị hệ thống" />}>
      <SectionHeader title="Tài khoản" actionLabel="Xem danh sách" onAction={toUsers} className="mb-2 mt-0" />
      <View className="-mx-1 flex-row flex-wrap">
        {(
          [
            { label: 'Tổng tài khoản', value: stats?.total, icon: UsersRound, tone: 'teal' },
            { label: 'Bệnh nhân', value: stats?.patients, icon: UserRound, tone: 'indigo' },
            { label: 'Nhân viên & quản trị', value: stats?.staff, icon: BriefcaseMedical, tone: 'amber' },
            { label: 'Đã khóa', value: stats?.locked, icon: Lock, tone: 'rose' },
          ] as const
        ).map((stat) => (
          <View key={stat.label} className="mb-2 w-1/2 px-1 lg:w-1/4">
            <StatCard {...stat} value={value(stat.value)} className="flex-1" />
          </View>
        ))}
      </View>

      <SectionHeader title="Quản trị" className="mb-2 mt-3" />
      <QuickActions
        actions={[
          { label: 'Thêm người dùng', icon: UserPlus, onPress: () => router.push('/admin/users/new') },
          {
            label: 'Thêm nhân viên',
            icon: BriefcaseMedical,
            onPress: () => router.push('/admin/users/new-staff'),
          },
          { label: 'Vai trò & quyền', icon: ShieldCheck, onPress: () => router.push('/admin/rbac') },
          { label: 'Cơ sở vật chất', icon: Building2, onPress: () => router.push('/admin/facilities') },
          { label: 'Mẫu phiếu khám', icon: FileText, onPress: () => router.push('/admin/templates') },
          { label: 'Hồ sơ bệnh án', icon: FileText, onPress: () => router.push('/admin/records') },
        ]}
      />
    </Screen>
  );
}
