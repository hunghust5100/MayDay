import { useRouter } from 'expo-router';
import {
  Activity,
  Bell,
  ClipboardList,
  ClipboardPlus,
  FlaskConical,
  Images,
  Pill,
  ScanFace,
  UserRoundPen,
} from 'lucide-react-native';

import { useSession } from '@/core/auth';
import { Card, IconButton, ListItem, Screen, ScreenTitle, SectionHeader } from '@/shared/ui';
import { formatDayLabel } from '@/shared/utils';

import { ActionBanner } from '../components/ActionBanner';
import { QuickActions } from '../components/QuickActions';

/** Trang chủ bệnh nhân — lối vào các chức năng. */
export function PatientHomeScreen() {
  const router = useRouter();
  const auth = useSession();
  const name = auth.status === 'signedIn' ? auth.user.display_name : '';

  return (
    <Screen
      header={
        <ScreenTitle
          eyebrow={formatDayLabel(new Date())}
          title={`Xin chào, ${name}`}
          right={<IconButton icon={Bell} accessibilityLabel="Thông báo" onPress={() => router.push('/patient/notifications')} />}
        />
      }>
      <ActionBanner
        icon={Activity}
        title="Chấm điểm UAS7 hôm nay"
        description="Ghi nhận mức độ ngứa và số nốt sẩn để bác sĩ theo dõi diễn tiến bệnh."
        actionLabel="Chấm điểm ngay"
        onPress={() => router.push('/patient/uas7')}
      />

      <SectionHeader title="Truy cập nhanh" className="mb-3 mt-6" />
      <QuickActions
        actions={[
          { label: 'Khai báo bệnh án', icon: ClipboardPlus, tone: 'teal', onPress: () => router.push('/patient/records/new') },
          { label: 'Ghi nhận tổn thương', icon: ScanFace, tone: 'rose', onPress: () => router.push('/patient/lesions') },
          { label: 'Đơn thuốc', icon: Pill, tone: 'indigo', onPress: () => router.push('/patient/prescriptions') },
          { label: 'Xét nghiệm', icon: FlaskConical, tone: 'amber', onPress: () => router.push('/patient/labs') },
          { label: 'Bệnh án', icon: ClipboardList, tone: 'indigo', onPress: () => router.push('/patient/records') },
          { label: 'Kho ảnh', icon: Images, tone: 'teal', onPress: () => router.push('/patient/media') },
          { label: 'Hồ sơ cá nhân', icon: UserRoundPen, tone: 'amber', onPress: () => router.push('/patient/profile') },
        ]}
      />

      <SectionHeader title="Bệnh án đang theo dõi" actionLabel="Xem tất cả" onAction={() => router.push('/patient/records')} className="mb-3 mt-2" />
      <Card padding="none" className="px-4">
        <ListItem
          title="Bệnh án của tôi"
          description="Theo dõi trạng thái khám, kết quả và chỉ định của bác sĩ"
          onPress={() => router.push('/patient/records')}
        />
      </Card>
    </Screen>
  );
}
