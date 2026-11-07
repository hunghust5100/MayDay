import { useRouter } from 'expo-router';
import { BriefcaseMedical, Building2, FileText, Lock, ShieldCheck, UserPlus, UserRound, UsersRound } from 'lucide-react-native';
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
      <View className="gap-3">
        <View className="flex-row gap-3">
          <StatCard label="Tổng tài khoản" value={value(stats?.total)} icon={UsersRound} tone="teal" onPress={toUsers} className="flex-1" />
          <StatCard label="Bệnh nhân" value={value(stats?.patients)} icon={UserRound} tone="indigo" onPress={toUsers} className="flex-1" />
        </View>
        <View className="flex-row gap-3">
          <StatCard label="Nhân viên & quản trị" value={value(stats?.staff)} icon={BriefcaseMedical} tone="amber" onPress={toUsers} className="flex-1" />
          <StatCard label="Đã khóa" value={value(stats?.locked)} icon={Lock} tone="rose" onPress={toUsers} className="flex-1" />
        </View>
      </View>

      <SectionHeader title="Quản trị" className="mb-3 mt-6" />
      <QuickActions
        actions={[
          { label: 'Thêm người dùng', icon: UserPlus, tone: 'teal', onPress: () => router.push('/admin/users/new') },
          { label: 'Thêm nhân viên', icon: BriefcaseMedical, tone: 'indigo', onPress: () => router.push('/admin/users/new-staff') },
          { label: 'Vai trò & quyền', icon: ShieldCheck, tone: 'amber', onPress: () => router.push('/admin/rbac') },
          { label: 'Chi nhánh & khoa', icon: Building2, tone: 'rose', onPress: () => router.push('/admin/facilities') },
          { label: 'Mẫu phiếu khám', icon: FileText, tone: 'teal', onPress: () => router.push('/admin/templates') },
        ]}
      />
    </Screen>
  );
}
