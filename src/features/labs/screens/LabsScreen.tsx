import { useLocalSearchParams, useRouter } from 'expo-router';
import { FlaskConical, Plus, Trash2 } from 'lucide-react-native';
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
  Screen,
  SectionHeader,
  Spinner,
  Text,
} from '@/shared/ui';
import { formatDateTime } from '@/shared/utils';

import { useCreateLabRequest, useLabResults } from '../hooks/useLabs';
import { labRequestSchema, type LabRequestFormValues } from '../schemas';

const EMPTY_ITEM = { test_name: '', description: '' };

function parseRecordId(raw: string | undefined): number | null {
  if (!raw || !/^[1-9]\d*$/.test(raw)) return null;
  return Number(raw);
}

/** Cận lâm sàng — chỉ định xét nghiệm (bác sĩ) và xem kết quả theo bệnh án (bác sĩ & bệnh nhân). */
export function LabsScreen() {
  const router = useRouter();
  const { recordId: paramRecordId } = useLocalSearchParams<{ recordId?: string }>();
  const auth = useSession();
  const user = auth.status === 'signedIn' ? auth.user : null;
  const canRequestLabs = user ? canEditClinicalRecord(user.role_id) : false;

  const [recordId, setRecordId] = useState<number | null>(() => parseRecordId(paramRecordId));

  const resultsQuery = useLabResults(recordId);
  const createMutation = useCreateLabRequest(recordId);

  const [nextRecordId, setNextRecordId] = useState<number | null>(null);
  const submitting = useRef(false);

  const form = useZodForm(labRequestSchema, {
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

  const submit = (values: LabRequestFormValues) => {
    if (!recordId || submitting.current) return;
    submitting.current = true;
    createMutation.mutate(
      {
        medical_record_id: recordId,
        note: values.note?.trim() || undefined,
        items: values.items.map((item) => ({
          test_name: item.test_name.trim(),
          description: item.description?.trim() || undefined,
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
    <Screen header={<AppHeader title="Cận lâm sàng" onBack={onBack} />}>
      <View className="gap-3 roomy:gap-4">
        <RecordSelector
          value={recordId}
          onChange={selectRecord}
          disabled={createMutation.isPending}
          initialRecordId={parseRecordId(paramRecordId)}
        />

        {recordId !== null && canRequestLabs && (
          <Card padding="lg" className="gap-3 roomy:gap-4">
            <SectionHeader title="Chỉ định xét nghiệm" className="mb-0 mt-0" />

            {fields.map((fieldItem, index) => (
              <View key={fieldItem.id} className="gap-3 rounded-card border border-border bg-bg p-3">
                <View className="flex-row items-center gap-2">
                  <Text variant="label" className="min-w-0 flex-1">Xét nghiệm {index + 1}</Text>
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
                  name={`items.${index}.test_name`}
                  render={(field) => (
                    <TextField
                      label="Tên xét nghiệm"
                      required
                      placeholder="VD: Định lượng IgE"
                      value={field.value}
                      onChange={field.onChange}
                      onBlur={field.onBlur}
                      error={field.error}
                    />
                  )}
                />

                <FormField
                  control={form.control}
                  name={`items.${index}.description`}
                  render={(field) => (
                    <TextField
                      label="Chi tiết chỉ định"
                      placeholder="VD: Dị ứng hô hấp"
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
                  label="Ghi chú chung"
                  placeholder="Lưu ý lấy mẫu, nhịn ăn..."
                  multiline
                  value={field.value}
                  onChange={field.onChange}
                  onBlur={field.onBlur}
                />
              )}
            />

            <View className="gap-2">
              <Button
                title="Thêm xét nghiệm"
                variant="soft"
                leftIcon={Plus}
                fullWidth
                onPress={() => append({ ...EMPTY_ITEM })}
              />
              <Button
                title={createMutation.isPending ? 'Đang lưu...' : 'Lưu chỉ định'}
                fullWidth
                loading={createMutation.isPending}
                onPress={() => void form.handleSubmit(submit)()}
              />
            </View>
          </Card>
        )}

        {recordId !== null && (
          <Card padding="lg" className="gap-3">
            <SectionHeader title="Kết quả xét nghiệm" className="mb-0 mt-0" />
            {resultsQuery.isLoading ? (
              <Spinner />
            ) : resultsQuery.isError ? (
              <ErrorState onRetry={() => void resultsQuery.refetch()} />
            ) : (resultsQuery.data?.length ?? 0) === 0 ? (
              <EmptyState icon={FlaskConical} title="Chưa có chỉ định xét nghiệm" />
            ) : (
              <View className="gap-3">
                {resultsQuery.data!.map((lab, index) => {
                  const hasResult = Boolean(lab.result_value);
                  return (
                    <View key={lab.id}>
                      {index > 0 && <Divider className="mb-3" />}
                      <View className="gap-1.5">
                        <View className="flex-row items-center justify-between gap-2">
                          <Text weight="bold" className="flex-1">
                            {lab.test_name}
                          </Text>
                          <Badge
                            label={hasResult ? 'Đã có kết quả' : 'Đang chờ'}
                            tone={hasResult ? 'success' : 'warning'}
                          />
                        </View>
                        {lab.description && (
                          <Text variant="caption" tone="muted">
                            {lab.description}
                          </Text>
                        )}
                        <Text variant="caption" tone={hasResult ? 'default' : 'muted'}>
                          Kết quả: {lab.result_value || 'Chưa có kết quả'}
                          {lab.reference_range ? ` (Tham chiếu: ${lab.reference_range})` : ''}
                        </Text>
                        {lab.note && (
                          <Text variant="caption" tone="muted">
                            Ghi chú: {lab.note}
                          </Text>
                        )}
                        <Text variant="tiny" tone="subtle">
                          Chỉ định lúc {formatDateTime(lab.created_at)}
                        </Text>
                      </View>
                    </View>
                  );
                })}
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
