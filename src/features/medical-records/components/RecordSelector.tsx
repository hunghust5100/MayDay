import { FileText } from 'lucide-react-native';
import { useEffect, useMemo } from 'react';
import { View } from 'react-native';

import { ROLE_IDS, useSession } from '@/core/auth';
import { MEDICAL_RECORD_STATUS } from '@/shared/constants';
import { SelectField, type SelectOption } from '@/shared/form';
import { Button, EmptyState, ErrorState, Spinner } from '@/shared/ui';
import { formatDateTime } from '@/shared/utils';

import { useRecordDetail, useRecords } from '../hooks/useRecords';
import type { MedicalRecord } from '../types';

export type RecordSelectorProps = {
  value: number | null;
  onChange: (recordId: number) => void;
  /** ID bệnh án truyền từ route params (nếu có). */
  initialRecordId?: number | null;
  label?: string;
  preferActive?: boolean;
};

/**
 * Chọn hồ sơ bệnh án thật cho Đơn thuốc / Cận lâm sàng.
 * Tự động lọc theo vai trò (bệnh nhân chỉ thấy bệnh án của mình) và chọn sẵn bệnh án mới nhất.
 */
export function RecordSelector({
  value,
  onChange,
  initialRecordId,
  label = 'Hồ sơ bệnh án',
  preferActive = false,
}: RecordSelectorProps) {
  const auth = useSession();
  const user = auth.status === 'signedIn' ? auth.user : null;
  const patientId = user?.role_id === ROLE_IDS.PATIENT ? user.user_id : undefined;

  const query = useRecords({}, patientId);
  const selectedFromList = query.items.find((r) => r.medical_record_id === value);
  const fallbackDetail = useRecordDetail(value && !selectedFromList ? value : 0);

  const records = useMemo(() => {
    const list = [...query.items];
    if (fallbackDetail.data && !list.some((r) => r.medical_record_id === fallbackDetail.data.medical_record_id)) {
      list.unshift(fallbackDetail.data);
    }
    return list;
  }, [query.items, fallbackDetail.data]);

  useEffect(() => {
    if (value !== null) return;
    if (initialRecordId && initialRecordId > 0) {
      onChange(initialRecordId);
      return;
    }
    if (query.items.length > 0) {
      const preferred =
        patientId === undefined
          ? (query.items.find((r) => r.status === 'in_progress') ?? query.items[0])
          : ((preferActive
              ? query.items.find((r) => r.status === 'pending' || r.status === 'in_progress')
              : undefined) ?? query.items[0]);
      onChange(preferred.medical_record_id);
    }
  }, [value, initialRecordId, query.items, patientId, onChange, preferActive]);

  const options = useMemo<SelectOption<number>[]>(
    () =>
      records.map((r: MedicalRecord) => ({
        value: r.medical_record_id,
        label: `Bệnh án #${r.medical_record_id} · ${MEDICAL_RECORD_STATUS[r.status].label}`,
        description: `${r.patient_name ?? `BN #${r.patient_id}`} · ${formatDateTime(r.created_at)}`,
      })),
    [records],
  );

  if (query.isLoading && value === null) {
    return (
      <View className="py-4">
        <Spinner />
      </View>
    );
  }

  if (query.isError && records.length === 0) {
    return <ErrorState onRetry={query.refetch} />;
  }

  if (records.length === 0) {
    return (
      <EmptyState
        icon={FileText}
        title="Chưa có hồ sơ bệnh án"
        description={
          patientId
            ? 'Bạn chưa có bệnh án nào. Hãy khai báo bệnh án trước khi xem mục này.'
            : 'Chưa có bệnh án nào trong hệ thống.'
        }
      />
    );
  }

  return (
    <View className="gap-2">
      <SelectField
        label={label}
        placeholder="Chọn bệnh án"
        leftIcon={FileText}
        options={options}
        value={value}
        onChange={onChange}
      />
      {query.hasNextPage && (
        <Button
          title="Tải thêm bệnh án để chọn"
          variant="ghost"
          loading={query.isFetchingNextPage}
          onPress={() => {
            void query.fetchNextPage();
          }}
        />
      )}
      {query.isError && records.length > 0 && (
        <ErrorState description="Không tải được thêm bệnh án." onRetry={query.refetch} />
      )}
    </View>
  );
}
