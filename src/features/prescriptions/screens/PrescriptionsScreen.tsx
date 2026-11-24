import { useLocalSearchParams, useRouter } from 'expo-router';
import { Pill, Plus, Trash2 } from 'lucide-react-native';
import { useRef, useState } from 'react';
import { useFieldArray } from 'react-hook-form';
import { View } from 'react-native';

import { canEditClinicalRecord, useSession } from '@/core/auth';
import { RecordSelector } from '@/features/medical-records';
import { FormField, TextField, useZodForm } from '@/shared/form';
import {
  AppHeader,
  Badge,
  Button,
  Card,
  ConfirmDialog,
  Divider,
  EmptyState,
  ErrorState,
  InfoRow,
  Screen,
  SectionHeader,
  Spinner,
  Text,
} from '@/shared/ui';
import { formatDateTime } from '@/shared/utils';

import { useCreatePrescription, usePrescriptions } from '../hooks/usePrescriptions';
import { prescriptionSchema, type PrescriptionFormValues } from '../schemas';

const EMPTY_ITEM = { medicine_name: '', dosage: '', frequency: '', duration: '', instruction: '' };

function parseRecordId(raw: string | undefined): number | null {
  if (!raw || !/^[1-9]\d*$/.test(raw)) return null;
  return Number(raw);
}

/** Đơn thuốc — xem đơn thuốc theo bệnh án (bệnh nhân & bác sĩ) hoặc kê đơn mới (bác sĩ). */
export function PrescriptionsScreen() {
  const router = useRouter();
  const { recordId: paramRecordId } = useLocalSearchParams<{ recordId?: string }>();
  const auth = useSession();
  const user = auth.status === 'signedIn' ? auth.user : null;
  const canPrescribe = user ? canEditClinicalRecord(user.role_id) : false;

  const [recordId, setRecordId] = useState<number | null>(() => parseRecordId(paramRecordId));

  const listQuery = usePrescriptions(recordId);
  const createMutation = useCreatePrescription(recordId);

  const [nextRecordId, setNextRecordId] = useState<number | null>(null);
  const submitting = useRef(false);

  const form = useZodForm(prescriptionSchema, {
    defaultValues: { note: '', items: [{ ...EMPTY_ITEM }] },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'items',
  });

  const { isDirty } = form.formState;
  const selectRecord = (nextId: number) => {
    if (nextId === recordId || submitting.current) return;
    if (recordId !== null && isDirty) {
      setNextRecordId(nextId);
      return;
    }
    setRecordId(nextId);
  };

  const onBack = () => (router.canGoBack() ? router.back() : router.replace('/'));

  const submit = (values: PrescriptionFormValues) => {
    if (!recordId || submitting.current) return;
    submitting.current = true;
    createMutation.mutate(
      {
        medical_record_id: recordId,
        note: values.note?.trim() || undefined,
        items: values.items.map((item) => ({
          medicine_name: item.medicine_name.trim(),
          dosage: item.dosage?.trim() || undefined,
          frequency: item.frequency?.trim() || undefined,
          duration: item.duration?.trim() || undefined,
          instruction: item.instruction?.trim() || undefined,
        })),
      },
      {
        onSettled: () => {
          submitting.current = false;
        },
        onSuccess: () => {
          form.reset({ note: '', items: [{ ...EMPTY_ITEM }] });
        },
      },
    );
  };

  return (
    <Screen header={<AppHeader title="Đơn thuốc" onBack={onBack} />}>
      <View className="gap-3 roomy:gap-4">
        <RecordSelector
          value={recordId}
          onChange={selectRecord}
          disabled={createMutation.isPending}
          initialRecordId={parseRecordId(paramRecordId)}
        />

        {recordId !== null && canPrescribe && listQuery.isSuccess && !listQuery.data?.length && (
          <Card padding="lg" className="gap-3 roomy:gap-4">
            <SectionHeader title="Kê đơn thuốc" className="mb-0 mt-0" />

            {fields.map((fieldItem, index) => (
              <View key={fieldItem.id} className="gap-3 rounded-card border border-border bg-bg p-3">
                <View className="flex-row items-center gap-2">
                  <Text variant="label" className="min-w-0 flex-1">Thuốc {index + 1}</Text>
                  {fields.length > 1 && (
                    <Button
                      title="Xóa"
                      variant="danger-soft"
                      size="sm"
                      leftIcon={Trash2}
                      onPress={() => remove(index)}
                    />
                  )}
                </View>

                <FormField
                  control={form.control}
                  name={`items.${index}.medicine_name`}
                  render={(field) => (
                    <TextField
                      label="Tên thuốc"
                      required
                      placeholder="VD: Loratadine 10mg"
                      value={field.value}
                      onChange={field.onChange}
                      onBlur={field.onBlur}
                      error={field.error}
                    />
                  )}
                />

                <View className="gap-3 roomy:flex-row">
                  <View className="min-w-0 roomy:flex-1">
                    <FormField
                      control={form.control}
                      name={`items.${index}.dosage`}
                      render={(field) => (
                        <TextField
                          label="Liều dùng"
                          placeholder="VD: 10mg"
                          value={field.value}
                          onChange={field.onChange}
                          onBlur={field.onBlur}
                        />
                      )}
                    />
                  </View>
                  <View className="min-w-0 roomy:flex-1">
                    <FormField
                      control={form.control}
                      name={`items.${index}.duration`}
                      render={(field) => (
                        <TextField
                          label="Số ngày"
                          placeholder="VD: 7 ngày"
                          value={field.value}
                          onChange={field.onChange}
                          onBlur={field.onBlur}
                        />
                      )}
                    />
                  </View>
                </View>

                <FormField
                  control={form.control}
                  name={`items.${index}.frequency`}
                  render={(field) => (
                    <TextField
                      label="Tần suất"
                      placeholder="VD: 1 viên/ngày"
                      value={field.value}
                      onChange={field.onChange}
                      onBlur={field.onBlur}
                    />
                  )}
                />

                <FormField
                  control={form.control}
                  name={`items.${index}.instruction`}
                  render={(field) => (
                    <TextField
                      label="Hướng dẫn sử dụng"
                      placeholder="VD: Uống sau bữa ăn sáng"
                      value={field.value}
                      onChange={field.onChange}
                      onBlur={field.onBlur}
                    />
                  )}
                />
              </View>
            ))}

            <FormField
              control={form.control}
              name="note"
              render={(field) => (
                <TextField
                  label="Ghi chú đơn thuốc"
                  placeholder="Lời dặn thêm cho bệnh nhân..."
                  multiline
                  value={field.value}
                  onChange={field.onChange}
                  onBlur={field.onBlur}
                />
              )}
            />

            <View className="gap-2">
              <Button
                title="Thêm dòng thuốc"
                variant="soft"
                leftIcon={Plus}
                fullWidth
                onPress={() => append({ ...EMPTY_ITEM })}
              />
              <Button
                title={createMutation.isPending ? 'Đang lưu...' : 'Lưu đơn thuốc'}
                fullWidth
                loading={createMutation.isPending}
                onPress={() => void form.handleSubmit(submit)()}
              />
            </View>
          </Card>
        )}

        {recordId !== null && (
          <Card padding="lg" className="gap-3">
            <SectionHeader title="Đơn thuốc đã kê" className="mb-0 mt-0" />
            {listQuery.isLoading ? (
              <Spinner />
            ) : listQuery.isError ? (
              <ErrorState onRetry={() => void listQuery.refetch()} />
            ) : (listQuery.data?.length ?? 0) === 0 ? (
              <EmptyState icon={Pill} title="Chưa có đơn thuốc" />
            ) : (
              <View className="gap-3 roomy:gap-4">
                {listQuery.data!.map((rx, rxIndex) => (
                  <View key={rx.id} className="gap-2">
                    {rxIndex > 0 && <Divider className="mb-2" />}
                    <View className="flex-row items-center justify-between gap-2">
                      <Badge label={`Đơn #${rx.id}`} tone="primary" />
                      <Text variant="caption" tone="muted">
                        {formatDateTime(rx.created_at)}
                      </Text>
                    </View>
                    {rx.doctor_name && <InfoRow label="Bác sĩ kê đơn" value={rx.doctor_name} />}
                    {rx.items.map((item, idx) => (
                      <View
                        key={item.id ?? `${rx.id}-${item.medicine_name}-${idx}`}
                        className="rounded-input border border-border bg-bg p-3"
                      >
                        <Text weight="bold">{item.medicine_name}</Text>
                        <Text variant="caption" tone="muted" className="mt-1">
                          {[item.dosage, item.frequency, item.duration].filter(Boolean).join(' · ') ||
                            'Chưa ghi liều dùng'}
                        </Text>
                        {item.instruction && (
                          <Text variant="caption" className="mt-1">
                            Hướng dẫn: {item.instruction}
                          </Text>
                        )}
                      </View>
                    ))}
                    {rx.note && (
                      <Text variant="caption" tone="muted">
                        Ghi chú: {rx.note}
                      </Text>
                    )}
                  </View>
                ))}
              </View>
            )}
          </Card>
        )}
      </View>
      <ConfirmDialog
        visible={nextRecordId !== null}
        title="Đổi bệnh án?"
        description="Đổi bệnh án sẽ xóa nội dung đang nhập."
        confirmLabel="Đổi bệnh án"
        cancelLabel="Tiếp tục nhập"
        onCancel={() => setNextRecordId(null)}
        onConfirm={() => {
          if (nextRecordId === null) return;
          form.reset({ note: '', items: [{ ...EMPTY_ITEM }] });
          setRecordId(nextRecordId);
          setNextRecordId(null);
        }}
      />
    </Screen>
  );
}
