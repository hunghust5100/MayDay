import { useRouter } from 'expo-router';
import { SlidersHorizontal } from 'lucide-react-native';
import { useState, type ReactElement } from 'react';
import { ScrollView, View } from 'react-native';

import { MEDICAL_RECORD_STATUS } from '@/shared/constants';
import { NumberField, SelectField } from '@/shared/form';
import type { MedicalRecordStatus } from '@/shared/types';
import { BottomSheet, Button, Card, ListItem, PaginatedList, SegmentedControl, StatusBadge, Text } from '@/shared/ui';
import { formatDateTime } from '@/shared/utils';

import { useRecords } from '../hooks/useRecords';

const statusOptions = [
  { value: '' as const, label: 'Tất cả' },
  ...Object.entries(MEDICAL_RECORD_STATUS).map(([value, { label }]) => ({
    value: value as MedicalRecordStatus,
    label,
  })),
];

export function RecordList({
  patientId,
  group,
  header,
  statusFilter,
}: {
  patientId?: number;
  group: 'patient' | 'doctor' | 'admin';
  header?: ReactElement;
  statusFilter?: { value: MedicalRecordStatus | ''; onChange: (value: MedicalRecordStatus | '') => void };
}) {
  const router = useRouter();
  const [localStatus, setLocalStatus] = useState<MedicalRecordStatus | ''>('');
  const status = statusFilter?.value ?? localStatus;
  const setStatus = statusFilter?.onChange ?? setLocalStatus;
  const [patientFilter, setPatientFilter] = useState<number | null>(null);
  const [appliedPatient, setAppliedPatient] = useState<number | undefined>();
  const [filterOpen, setFilterOpen] = useState(false);
  const [draftStatus, setDraftStatus] = useState<MedicalRecordStatus | ''>('');
  const query = useRecords({ status: status || undefined, patient_id: appliedPatient }, patientId);
  const items = patientId && status ? query.items.filter((r) => r.status === status) : query.items;
  const activeFilters = [
    status ? MEDICAL_RECORD_STATUS[status].label : null,
    appliedPatient ? `Bệnh nhân #${appliedPatient}` : null,
  ].filter(Boolean);
  const applyFilters = (nextStatus: MedicalRecordStatus | '', nextPatient?: number) => {
    setStatus(nextStatus);
    setAppliedPatient(nextPatient);
    setFilterOpen(false);
  };
  const listHeader = (
    <View className="gap-2 pb-2">
      {header}
      {patientId ? (
        <SelectField label="Trạng thái" value={status} onChange={setStatus} options={statusOptions} />
      ) : (
        <View className="flex-row flex-wrap items-center gap-x-3 gap-y-1">
          <Button
            title={activeFilters.length ? `Bộ lọc (${activeFilters.length})` : 'Bộ lọc'}
            size="sm"
            leftIcon={SlidersHorizontal}
            variant="soft"
            onPress={() => {
              setDraftStatus(status);
              setPatientFilter(appliedPatient ?? null);
              setFilterOpen(true);
            }}
          />
          {activeFilters.length > 0 && <Text variant="caption" tone="muted" className="shrink">{activeFilters.join(' · ')}</Text>}
        </View>
      )}
    </View>
  );
  return (
    <>
      <PaginatedList
        {...query.listProps}
        data={items}
        padded={false}
        ListHeaderComponent={listHeader}
        keyExtractor={(r) => String(r.medical_record_id)}
        emptyTitle="Chưa có bệnh án phù hợp"
        renderItem={({ item }) => (
          <Card padding="none" className="px-3">
            <ListItem
              title={group === 'patient' ? `Bệnh án #${item.medical_record_id}` : (item.patient_name ?? `Bệnh nhân #${item.patient_id}`)}
              description={group === 'patient'
                ? formatDateTime(item.created_at)
                : `Bệnh án #${item.medical_record_id} · ${formatDateTime(item.created_at)}`
              }
              trailing={<StatusBadge status={item.status} />}
              onPress={() => router.push(`/${group}/records/${item.medical_record_id}`)}
              chevron={false}
            />
          </Card>
        )}
      />
      {!patientId && (
        <BottomSheet
          visible={filterOpen}
          onClose={() => setFilterOpen(false)}
          title="Lọc bệnh án"
          footer={
            <View className="flex-row items-stretch gap-2">
              <Button title="Xóa bộ lọc" size="sm" variant="ghost" className="min-w-0 flex-1 self-stretch" onPress={() => applyFilters('')} />
              <Button
                title="Áp dụng"
                size="sm"
                className="min-w-0 flex-1 self-stretch"
                onPress={() => applyFilters(draftStatus, patientFilter && patientFilter > 0 ? patientFilter : undefined)}
              />
            </View>
          }>
          <ScrollView className="shrink" keyboardShouldPersistTaps="handled" contentContainerClassName="gap-3 pb-3">
            <View className="gap-2">
              <Text variant="label">Trạng thái</Text>
              <SegmentedControl wrap options={statusOptions} value={draftStatus} onChange={setDraftStatus} />
            </View>
            <NumberField label="Mã bệnh nhân" value={patientFilter} onChange={setPatientFilter} />
          </ScrollView>
        </BottomSheet>
      )}
    </>
  );
}
