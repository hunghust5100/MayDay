import { useLocalSearchParams, useRouter } from 'expo-router';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useMemo, useRef, useState } from 'react';
import { View } from 'react-native';
import { canCreatePatient, ROLE_IDS, useSession } from '@/core/auth';
import { getErrorMessage } from '@/core/api';
import { QuestionImageField } from '@/features/media';
import type { ImageSelections } from '@/shared/types/clinical-form';
import {
  ClinicalForm,
  questionVisible,
  serializeAnswers,
  useTemplate,
  validateForm,
  type ClinicalTemplate,
  type FormValues,
} from '@/features/dynamic-form';
import { AppHeader, Button, EmptyState, ErrorState, Screen, Spinner, Text, toast } from '@/shared/ui';
import { recordsApi } from '../api/records-api';
import { useCreateRecord } from '../hooks/useRecords';
import { createRecordSchema } from '../schemas';
import type { ClassificationQuestion } from '../types';
import { saveRecordImages, visibleRecordImages } from '../api/record-media';

function buildClassifierTemplate(questions: ClassificationQuestion[]): ClinicalTemplate {
  return {
    code_template: 'classification',
    name: 'Phân loại',
    sections: [
      {
        section_id: 'classification',
        title: 'Thông tin phân loại',
        filled_by: 'patdoc',
        questions: questions.map((q) => ({ ...q, is_required: q.is_required ?? true })),
      },
    ],
  };
}

export function MedicalRecordCreateScreen() {
  const router = useRouter();
  const { patientId } = useLocalSearchParams<{ patientId?: string }>();
  const { user } = useSession();
  const patient = user?.role_id === ROLE_IDS.PATIENT;
  const [classification, setClassification] = useState<FormValues>({});
  const [values, setValues] = useState<FormValues>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [images, setImages] = useState<ImageSelections>({});
  const [createdId, setCreatedId] = useState<number | null>(null);
  const [finishing, setFinishing] = useState(false);
  const submitting = useRef(false);
  const questions = useQuery({
    queryKey: ['medical-records', 'classification'],
    queryFn: ({ signal }) => recordsApi.classifyQuestions(signal),
  });
  const classify = useMutation({ mutationFn: recordsApi.classify });
  const template = useTemplate(classify.data?.template_id);
  const create = useCreateRecord();
  const actor = patient ? 'patient' : 'doctor';
  const classifier = useMemo(() => buildClassifierTemplate(questions.data ?? []), [questions.data]);
  if (!user) return null;
  const allowed = patient || (canCreatePatient(user.role_id) && /^[1-9]\d*$/.test(patientId ?? ''));
  const submit = async () => {
    if (!template.data || create.isPending || submitting.current) return;
    const desired = visibleRecordImages(template.data, values, images);
    const validation = validateForm(template.data, values, actor, { images: desired });
    setErrors(validation);
    if (Object.keys(validation).length) return;
    const body = {
      template_id: template.data.code_template,
      ...(patient ? {} : { patient_id: Number(patientId) }),
      answers: serializeAnswers(template.data, values, actor, desired),
    };
    if (!createRecordSchema.safeParse(body).success) {
      toast.error('Thông tin bệnh án không hợp lệ.');
      return;
    }
    submitting.current = true;
    setFinishing(true);
    let id = createdId;
    try {
      if (!id) {
        const record = await create.mutateAsync(body);
        id = record.medical_record_id;
        setCreatedId(id);
      } else if (body.answers.length) await recordsApi.saveAnswers(id, body.answers);
      await saveRecordImages(id, template.data, values, desired, actor);
      toast.success('Đã tạo bệnh án.');
      router.replace(`/${patient ? 'patient' : 'doctor'}/records/${id}`);
    } catch (error) {
      if (id)
        toast.error(
          `Bệnh án #${id} đã tạo; chưa hoàn tất ảnh: ${getErrorMessage(error)}. Bấm tiếp tục để thử lại, không tạo thêm bệnh án.`,
        );
    } finally {
      submitting.current = false;
      setFinishing(false);
    }
  };
  return (
    <Screen header={<AppHeader title="Khai báo bệnh án" onBack={() => router.canGoBack() ? router.back() : router.replace('/')} />}>
      {!allowed ? (
        <EmptyState
          title="Không thể tạo bệnh án"
          description="Chọn bệnh nhân từ danh sách và kiểm tra quyền tài khoản."
        />
      ) : (
        <View className="gap-3 roomy:gap-4">
          {!classify.data ? (
            <>
              {questions.isLoading ? (
                <Spinner />
              ) : questions.isError ? (
                <ErrorState onRetry={() => questions.refetch()} />
              ) : (
                <>
                  <ClinicalForm
                    template={classifier}
                    values={classification}
                    onChange={setClassification}
                    actor={actor}
                    errors={errors}
                  />
                  <Button
                    title="Tiếp tục"
                    loading={classify.isPending}
                    disabled={!questions.data?.length}
                    onPress={() => {
                      const validation = validateForm(classifier, classification, actor);
                      setErrors(validation);
                      if (Object.keys(validation).length) return;
                      classify.mutate(
                        (questions.data ?? [])
                          .filter((q) => questionVisible(q, classification, questions.data ?? []))
                          .flatMap((q) => {
                            const v = classification[q.question_id];
                            if (v == null || v === '') return [];
                            return (Array.isArray(v) ? v : [v]).map((item) => ({
                              question_id: q.question_id,
                              option_value: String(item),
                            }));
                          }),
                        {
                          onSuccess: () => {
                            setValues({});
                            setImages({});
                            setErrors({});
                          },
                        },
                      );
                    }}
                  />
                </>
              )}
            </>
          ) : (
            <>
              <Text variant="h3">{classify.data.template_name}</Text>
              {template.isLoading ? (
                <Spinner />
              ) : template.isError ? (
                <ErrorState onRetry={() => template.refetch()} />
              ) : template.data ? (
                <>
                  <ClinicalForm
                    template={template.data}
                    values={values}
                    onChange={(next) => {
                      if (!finishing) setValues(next);
                    }}
                    actor={actor}
                    errors={errors}
                    renderAttachments={(question, editable) => (
                      <QuestionImageField
                        question={question}
                        answer={values[question.question_id]}
                        images={images[question.question_id] ?? []}
                        editable={editable && !finishing}
                        context={
                          createdId
                            ? {
                                medical_record_id: createdId,
                                question_id: question.question_id,
                                category: 'answer',
                              }
                            : { category: 'answer' }
                        }
                        onChange={(next) =>
                          setImages((current) => ({ ...current, [question.question_id]: next }))
                        }
                      />
                    )}
                  />
                  {createdId && (
                    <Text tone="muted">
                      Bệnh án #{createdId} đã được tạo. Tiếp tục để hoàn tất các ảnh còn thiếu.
                    </Text>
                  )}
                  <Button
                    title={createdId ? 'Tiếp tục hoàn tất ảnh' : 'Tạo bệnh án'}
                    loading={create.isPending || finishing}
                    onPress={() => {
                      void submit();
                    }}
                  />
                </>
              ) : null}
              <Button
                title="Quay lại phân loại"
                variant="ghost"
                disabled={create.isPending || finishing || createdId !== null}
                onPress={() => {
                  classify.reset();
                  setErrors({});
                }}
              />
            </>
          )}
        </View>
      )}
    </Screen>
  );
}
