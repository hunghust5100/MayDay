import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';
import { canEditClinicalRecord, getRoleGroup, ROLE_IDS, useSession } from '@/core/auth';
import { getErrorMessage } from '@/core/api';
import { QuestionImageField, useRecordImages } from '@/features/media';
import type { ImageSelections } from '@/shared/types/clinical-form';
import {
  ClinicalForm,
  serializeAnswers,
  useTemplate,
  validateForm,
  type ClinicalTemplate,
  type FormValues,
} from '@/features/dynamic-form';
import { TextField } from '@/shared/form';
import {
  AppHeader,
  Button,
  Card,
  ConfirmDialog,
  Divider,
  EmptyState,
  ErrorState,
  InfoRow,
  Screen,
  Spinner,
  StatusBadge,
  Text,
  toast,
} from '@/shared/ui';
import { formatDateTime } from '@/shared/utils';
import { useRecord, useRecordMutations } from '../hooks/useRecords';
import { recordUpdateSchema } from '../schemas';
import type { MedicalRecord, RecordAnswer, RecordSummary } from '../types';
import { saveRecordImages, visibleRecordImages } from '../api/record-media';

function toValues(answers: RecordAnswer[], template: ClinicalTemplate): FormValues {
  const values: FormValues = {};
  for (const answer of answers) {
    const q = template.sections.flatMap((s) => s.questions).find((q) => q.question_id === answer.question_id);
    const raw = answer.answer_value?.value;
    values[answer.question_id] =
      answer.answer_text ??
      (typeof raw === 'string' ||
      typeof raw === 'number' ||
      (Array.isArray(raw) && raw.every((v) => typeof v === 'string'))
        ? raw
        : (q?.options?.find((o) => Number(o.id) === answer.question_option_id)?.option_value ?? null));
  }
  return values;
}
function DetailForm({
  record,
  summary,
  answers,
  template,
}: {
  record: MedicalRecord;
  summary?: RecordSummary;
  answers: RecordAnswer[];
  template: ClinicalTemplate;
}) {
  const router = useRouter();
  const { user } = useSession();
  const mutations = useRecordMutations(record.medical_record_id);
  const [values, setValues] = useState<FormValues>(() => toValues(answers, template));
  const [instructions, setInstructions] = useState(record.instructions ?? '');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [confirm, setConfirm] = useState<'completed' | 'cancelled' | 'delete' | null>(null);
  const linkedImages = useRecordImages(answers);
  const [imageDraft, setImageDraft] = useState<ImageSelections>({});
  const [savingImages, setSavingImages] = useState(false);
  const images = { ...linkedImages.images, ...imageDraft };
  if (!user) return null;
  const patient = user.role_id === ROLE_IDS.PATIENT;
  const doctor = canEditClinicalRecord(user.role_id);
  const assigned = doctor && record.assigned_doctor_id === user.user_id;
  const editable = patient
    ? record.patient_id === user.user_id && record.status === 'pending'
    : assigned && record.status === 'in_progress';
  const actor = editable ? (patient ? 'patient' : 'doctor') : 'readonly';
  const busy =
    mutations.save.isPending ||
    mutations.update.isPending ||
    mutations.remove.isPending ||
    mutations.accept.isPending ||
    savingImages ||
    linkedImages.isLoading ||
    linkedImages.isError;
  const saveAnswers = async () => {
    const desired = visibleRecordImages(template, values, images);
    const validation = validateForm(template, values, actor, { images: desired });
    setErrors(validation);
    if (Object.keys(validation).length) return false;
    const body = serializeAnswers(template, values, actor, desired);
    if (body.length) await mutations.save.mutateAsync(body);
    setSavingImages(true);
    try {
      await saveRecordImages(record.medical_record_id, template, values, images, actor, linkedImages.images);
      setImageDraft({});
    } catch (error) {
      toast.error(
        `Câu trả lời đã lưu nhưng ảnh chưa hoàn tất: ${getErrorMessage(error)}. Bấm lưu để thử lại.`,
      );
      throw error;
    } finally {
      setSavingImages(false);
    }
    return true;
  };
  const finish = async () => {
    if (!confirm || busy) return;
    try {
      if (confirm === 'delete') {
        await mutations.remove.mutateAsync();
        toast.success('Đã xóa bệnh án.');
        router.back();
      } else {
        const body = recordUpdateSchema.parse({ status: confirm, instructions });
        if (confirm === 'completed' && !(await saveAnswers())) {
          setConfirm(null);
          return;
        }
        await mutations.update.mutateAsync(body);
        toast.success(confirm === 'completed' ? 'Đã chốt bệnh án.' : 'Đã hủy bệnh án.');
      }
      setConfirm(null);
    } catch {
      /* MutationCache hiển thị lỗi; giữ nguyên nội dung người dùng. */
    }
  };
  return (
    <Screen header={<AppHeader title={`Bệnh án #${record.medical_record_id}`} onBack={router.back} />}>
      <View className="gap-4">
        <Card padding="lg" className="gap-1">
          <View className="mb-2 flex-row items-center justify-between gap-2">
            <Text variant="h2" className="flex-1">
              {summary?.patient_name ?? record.patient_name ?? `Bệnh nhân #${record.patient_id}`}
            </Text>
            <StatusBadge status={record.status} />
          </View>
          <InfoRow label="Ngày tạo" value={formatDateTime(record.created_at)} />
          <Divider />
          <InfoRow
            label="Bác sĩ phụ trách"
            value={record.assigned_doctor_id ? `#${record.assigned_doctor_id}` : 'Chưa tiếp nhận'}
          />
          {record.completed_at && (
            <>
              <Divider />
              <InfoRow label="Hoàn thành" value={formatDateTime(record.completed_at)} />
            </>
          )}
        </Card>
        <Text variant="h3">{template.name}</Text>
        {linkedImages.isLoading && <Text tone="muted">Đang tải ảnh đính kèm…</Text>}
        {linkedImages.isError && (
          <ErrorState title="Chưa tải được ảnh đính kèm" onRetry={() => linkedImages.refetch()} />
        )}
        <ClinicalForm
          template={template}
          values={values}
          onChange={(next) => {
            if (!busy) setValues(next);
          }}
          actor={actor}
          errors={errors}
          renderAttachments={(question, canEdit) => (
            <QuestionImageField
              question={question}
              answer={values[question.question_id]}
              images={images[question.question_id] ?? []}
              editable={canEdit && !busy}
              context={{
                medical_record_id: record.medical_record_id,
                question_id: question.question_id,
                category: 'answer',
              }}
              onChange={(next) => setImageDraft((current) => ({ ...current, [question.question_id]: next }))}
            />
          )}
        />
        {patient && (
          <Button
            title="Theo dõi tổn thương của bệnh án"
            variant="soft"
            onPress={() =>
              router.push({ pathname: '/patient/lesions', params: { recordId: record.medical_record_id } })
            }
          />
        )}
        {getRoleGroup(user.role_id) !== 'admin' && (
          <Button
            title="Xem kho ảnh bệnh nhân"
            variant="ghost"
            onPress={() =>
              router.push({
                pathname: patient ? '/patient/media' : '/doctor/media',
                params: {
                  userId: record.patient_id,
                  recordId: record.medical_record_id,
                  recordStatus: record.status,
                },
              })
            }
          />
        )}
        {assigned && record.status === 'in_progress' ? (
          <TextField label="Chỉ dẫn của bác sĩ" multiline value={instructions} onChange={setInstructions} />
        ) : (
          <>
            <Text variant="h3">Chỉ dẫn của bác sĩ</Text>
            <Text>{record.instructions || 'Chưa có chỉ dẫn'}</Text>
          </>
        )}
        {editable && (
          <Button
            title="Lưu câu trả lời"
            disabled={busy}
            loading={mutations.save.isPending}
            onPress={async () => {
              try {
                if (await saveAnswers()) toast.success('Đã lưu câu trả lời.');
              } catch {
                /* giữ dữ liệu */
              }
            }}
          />
        )}
        {doctor && record.status === 'pending' && (
          <Button
            title="Tiếp nhận khám"
            disabled={busy}
            loading={mutations.accept.isPending}
            onPress={() => mutations.accept.mutate()}
          />
        )}
        {assigned && record.status === 'in_progress' && (
          <>
            <Button title="Chốt bệnh án" disabled={busy} onPress={() => setConfirm('completed')} />
            <Button
              title="Hủy bệnh án"
              variant="danger"
              disabled={busy}
              onPress={() => setConfirm('cancelled')}
            />
          </>
        )}
        {getRoleGroup(user.role_id) === 'admin' && (
          <Button title="Xóa bệnh án" variant="danger" disabled={busy} onPress={() => setConfirm('delete')} />
        )}
      </View>
      <ConfirmDialog
        visible={confirm !== null}
        title={
          confirm === 'delete' ? 'Xóa bệnh án?' : confirm === 'cancelled' ? 'Hủy bệnh án?' : 'Chốt bệnh án?'
        }
        description={
          confirm === 'delete'
            ? 'Bệnh án và các câu trả lời sẽ bị xóa. Tệp ảnh gốc được giữ lại.'
            : 'Các câu trả lời được lưu trước khi cập nhật trạng thái. Sau đó hồ sơ chuyển sang chỉ đọc.'
        }
        destructive={confirm !== 'completed'}
        loading={busy}
        onCancel={() => setConfirm(null)}
        onConfirm={() => {
          void finish();
        }}
      />
    </Screen>
  );
}
function RecordDetail({ id }: { id: number }) {
  const router = useRouter();
  const { detail, summary, answers } = useRecord(id);
  const template = useTemplate(detail.data?.template_id);
  const loading = detail.isLoading || answers.isLoading || (detail.isSuccess && template.isLoading);
  const failed = detail.isError || answers.isError || template.isError;
  if (loading || failed || !detail.data || !answers.data || !template.data)
    return (
      <Screen header={<AppHeader title="Chi tiết bệnh án" onBack={router.back} />}>
        {loading ? (
          <Spinner />
        ) : (
          <ErrorState
            onRetry={() => {
              detail.refetch();
              answers.refetch();
              summary.refetch();
              template.refetch();
            }}
          />
        )}
      </Screen>
    );
  return (
    <DetailForm
      key={`${id}-${detail.data.status}-${detail.data.updated_at ?? ''}`}
      record={detail.data}
      summary={summary.data}
      answers={answers.data}
      template={template.data}
    />
  );
}
export function MedicalRecordDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  if (!/^[1-9]\d*$/.test(id ?? ''))
    return (
      <Screen>
        <EmptyState title="Bệnh án không hợp lệ" />
      </Screen>
    );
  return <RecordDetail id={Number(id)} />;
}
