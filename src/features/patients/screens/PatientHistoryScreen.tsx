import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { View } from 'react-native';

import { canCreatePatient, useSession } from '@/core/auth';
import { RecordList } from '@/features/medical-records';
import { genderLabel } from '@/shared/constants';
import { AppHeader, Button, Card, Divider, EmptyState, InfoRow, Screen } from '@/shared/ui';
import { formatDate, formatPhone } from '@/shared/utils';

import type { Patient } from '../types';

export function PatientHistoryScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [showProfile, setShowProfile] = useState(false);
  const back = () => (router.canGoBack() ? router.back() : router.replace('/doctor/patients'));
  const client = useQueryClient();
  const { user } = useSession();
  const patient = client.getQueryData<Patient>(['patients', 'selected', Number(id)]);
  if (!/^[1-9]\d*$/.test(id ?? ''))
    return (
      <Screen header={<AppHeader title="Bệnh nhân" onBack={back} />}>
        <EmptyState title="Bệnh nhân không hợp lệ" />
      </Screen>
    );

  const address = patient
    ? [patient.hamlet_address, patient.commune_address, patient.city_address].filter(Boolean).join(', ')
    : '';
  const infoRows = patient
    ? (
        [
          ['Số điện thoại', formatPhone(patient.phone)],
          ['Giới tính', genderLabel(patient.gender)],
          ['Năm sinh', patient.year_of_birth],
          ['Địa chỉ', address || null],
          ['Nghề nghiệp', patient.career],
          ['Dân tộc', patient.ethnic],
          ['Nơi làm việc', patient.work_place],
          ['Số BHYT', patient.health_insurance_number],
          [
            'Hạn BHYT',
            patient.health_insurance_validate ? formatDate(patient.health_insurance_validate) : null,
          ],
          ['Người nhà', patient.next_of_kin_name],
          ['SĐT người nhà', patient.next_of_kin_phone ? formatPhone(patient.next_of_kin_phone) : null],
        ] as const
      ).filter(([, value]) => value != null && value !== '')
    : [];

  const historyHeader = (
    <View className="gap-3">
      {infoRows.length > 0 && (
        <Button
          title={showProfile ? 'Thu gọn thông tin bệnh nhân' : 'Xem thông tin bệnh nhân'}
          variant="soft"
          accessibilityState={{ expanded: showProfile }}
          onPress={() => setShowProfile(!showProfile)}
        />
      )}
      {showProfile && infoRows.length > 0 && (
        <Card className="py-1">
          {infoRows.map(([label, value], index) => (
            <View key={label}>
              {index > 0 && <Divider />}
              <InfoRow label={label} value={value} layout={label === 'Địa chỉ' ? 'stacked' : 'inline'} />
            </View>
          ))}
        </Card>
      )}
      {user && canCreatePatient(user.role_id) && (
        <Button
          title="Tạo bệnh án"
          onPress={() => router.push({ pathname: '/doctor/records/new', params: { patientId: id } })}
        />
      )}
    </View>
  );
  return (
    <Screen
      scroll={false}
      header={<AppHeader title={patient?.full_name ?? `Bệnh nhân #${id}`} onBack={back} />}
    >
      <RecordList patientId={Number(id)} group="doctor" header={historyHeader} />
    </Screen>
  );
}
