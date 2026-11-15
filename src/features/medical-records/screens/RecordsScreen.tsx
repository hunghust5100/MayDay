import { useRouter } from 'expo-router';
import { View } from 'react-native';
import { canCreatePatient, useSession, getRoleGroup } from '@/core/auth';
import { AppHeader, Button, Screen, ScreenTitle } from '@/shared/ui';
import { RecordList } from '../components/RecordList';
export function RecordsScreen() {
  const { user } = useSession();
  const router = useRouter();
  if (!user) return null;
  const group = getRoleGroup(user.role_id);
  return (
    <Screen
      scroll={false}
      header={
        group === 'admin' ? (
          <AppHeader title="Quản lý bệnh án" onBack={router.back} />
        ) : (
          <ScreenTitle
            title="Bệnh án"
            eyebrow={group === 'patient' ? 'Lịch sử khám của bạn' : 'Tiếp nhận và theo dõi khám'}
          />
        )
      }
    >
      {(group === 'patient' || canCreatePatient(user.role_id)) && (
        <View className="pb-3">
          <Button
            title={group === 'patient' ? 'Khai báo bệnh án' : 'Tạo bệnh án cho bệnh nhân'}
            onPress={() => router.push(group === 'patient' ? '/patient/records/new' : '/doctor/patients')}
          />
        </View>
      )}
      <RecordList
        patientId={group === 'patient' ? user.user_id : undefined}
        group={group === 'staff' ? 'doctor' : group}
      />
    </Screen>
  );
}
