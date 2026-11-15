import { useRouter } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';
import { MEDICAL_RECORD_STATUS } from '@/shared/constants';
import { SelectField, NumberField } from '@/shared/form';
import { Button, ListItem, PaginatedList, StatusBadge } from '@/shared/ui';
import type { MedicalRecordStatus } from '@/shared/types';
import { formatDateTime } from '@/shared/utils';
import { useRecords } from '../hooks/useRecords';
export function RecordList({ patientId, group }: { patientId?: number; group: 'patient' | 'doctor' | 'admin' }) {
  const router = useRouter();
  const [status, setStatus] = useState<MedicalRecordStatus | ''>('');
  const [patientFilter, setPatientFilter] = useState<number | null>(null);
  const [appliedPatient, setAppliedPatient] = useState<number | undefined>();
  const query = useRecords({ status: status || undefined, patient_id: appliedPatient }, patientId);
  const items = patientId && status ? query.items.filter((r) => r.status === status) : query.items;
  return (
    <View className="flex-1 gap-3">
      <SelectField
        label="Trạng thái"
        value={status}
        onChange={setStatus}
        options={[
          { value: '' as const, label: 'Tất cả' },
          ...Object.entries(MEDICAL_RECORD_STATUS).map(([value, v]) => ({
            value: value as MedicalRecordStatus,
            label: v.label,
          })),
        ]}
      />
      {!patientId && (
        <View className="gap-2">
          <NumberField label="Lọc theo ID bệnh nhân" value={patientFilter} onChange={setPatientFilter} />
          <Button
            title="Áp dụng"
            variant="soft"
            onPress={() => setAppliedPatient(patientFilter && patientFilter > 0 ? patientFilter : undefined)}
          />
        </View>
      )}
      <PaginatedList
        {...query.listProps}
        data={items}
        padded={false}
        keyExtractor={(r) => String(r.medical_record_id)}
        emptyTitle="Chưa có bệnh án phù hợp"
        renderItem={({ item }) => (
          <ListItem
            title={item.patient_name ?? `Bệnh án #${item.medical_record_id}`}
            description={`BN #${item.patient_id} · ${formatDateTime(item.created_at)}`}
            trailing={<StatusBadge status={item.status} />}
            onPress={() => router.push(`/${group}/records/${item.medical_record_id}`)}
          />
        )}
      />
    </View>
  );
}
