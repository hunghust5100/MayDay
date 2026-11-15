import { useLocalSearchParams, useRouter } from 'expo-router';
import { useQueryClient } from '@tanstack/react-query';
import { canCreatePatient, useSession } from '@/core/auth';
import { View } from 'react-native';
import { AppHeader, Button, EmptyState, Screen, Text } from '@/shared/ui';
import { RecordList } from '@/features/medical-records';
import type { Patient } from '../types';
export function PatientHistoryScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const client = useQueryClient();
  const { user } = useSession();
  const patient = client.getQueryData<Patient>(['patients', 'selected', Number(id)]);
  if (!/^[1-9]\d*$/.test(id ?? ''))
    return (
      <Screen>
        <EmptyState title="Bệnh nhân không hợp lệ" />
      </Screen>
    );
  return (
    <Screen scroll={false} header={<AppHeader title={patient?.full_name ?? `Bệnh nhân #${id}`} onBack={router.back} />}>
      <View className="gap-2 pb-4">
        {patient && (
          <>
            <Text>
              {patient.phone} · {patient.year_of_birth ?? 'Chưa rõ năm sinh'}
            </Text>
            {(
              [
                [
                  'Giới tính',
                  patient.gender === 'male'
                    ? 'Nam'
                    : patient.gender === 'female'
                      ? 'Nữ'
                      : patient.gender === 'other'
                        ? 'Khác'
                        : null,
                ],
                [
                  'Địa chỉ',
                  [patient.hamlet_address, patient.commune_address, patient.city_address].filter(Boolean).join(', '),
                ],
                ['Nghề nghiệp', patient.career],
                ['Dân tộc', patient.ethnic],
                ['Nơi làm việc', patient.work_place],
                ['Số BHYT', patient.health_insurance_number],
                ['Hạn BHYT', patient.health_insurance_validate],
                ['Người nhà', patient.next_of_kin_name],
                ['SĐT người nhà', patient.next_of_kin_phone],
              ] as const
            ).map(([label, value]) =>
              value ? (
                <Text key={label}>
                  {label}: {value}
                </Text>
              ) : null,
            )}
          </>
        )}
        {user && canCreatePatient(user.role_id) && (
          <Button
            title="Tạo bệnh án"
            onPress={() => router.push({ pathname: '/doctor/records/new', params: { patientId: id } })}
          />
        )}
      </View>
      <RecordList patientId={Number(id)} group="doctor" />
    </Screen>
  );
}
