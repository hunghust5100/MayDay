import { useLocalSearchParams, useRouter } from 'expo-router';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { View } from 'react-native';
import { canCreatePatient, useSession } from '@/core/auth';
import {
  ClinicalForm,
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

export function MedicalRecordCreateScreen() {
  const router = useRouter();
  const { patientId } = useLocalSearchParams<{ patientId?: string }>();
  const { user } = useSession();
  const patient = user?.role_id === 3;
  const [classification, setClassification] = useState<FormValues>({});
  const [values, setValues] = useState<FormValues>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const questions = useQuery({
    queryKey: ['medical-records', 'classification'],
    queryFn: ({ signal }) => recordsApi.classifyQuestions(signal),
  });
  const classify = useMutation({ mutationFn: recordsApi.classify });
  const template = useTemplate(classify.data?.template_id);
  const create = useCreateRecord();
  const actor = patient ? 'patient' : 'doctor';
  const classifier: ClinicalTemplate = {
    code_template: 'classification',
    name: 'Phân loại',
    sections: [
      {
        section_id: 'classification',
        title: 'Thông tin phân loại',
        filled_by: 'both',
        questions: (questions.data ?? []).map((q) => ({ ...q, is_required: true })),
      },
    ],
  };
  if (!user) return null;
  const allowed = patient || (canCreatePatient(user.role_id) && /^[1-9]\d*$/.test(patientId ?? ''));
  const submit = () => {
    if (!template.data || create.isPending) return;
    const validation = validateForm(template.data, values, actor);
    setErrors(validation);
    if (Object.keys(validation).length) return;
    const body = {
      template_id: template.data.code_template,
      ...(patient ? {} : { patient_id: Number(patientId) }),
      answers: serializeAnswers(template.data, values, actor),
    };
    if (!createRecordSchema.safeParse(body).success) {
      toast.error('Thông tin bệnh án không hợp lệ.');
      return;
    }
    create.mutate(body, {
      onSuccess: (record) => {
        toast.success('Đã tạo bệnh án.');
        router.replace(`/${patient ? 'patient' : 'doctor'}/records/${record.medical_record_id}`);
      },
    });
  };
  return (
    <Screen header={<AppHeader title="Khai báo bệnh án" onBack={router.back} />}>
      {!allowed ? (
        <EmptyState
          title="Không thể tạo bệnh án"
          description="Chọn bệnh nhân từ danh sách và kiểm tra quyền tài khoản."
        />
      ) : (
        <View className="gap-4">
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
                        questions.data!.flatMap((q) => {
                          const v = classification[q.question_id];
                          return (Array.isArray(v) ? v : [v]).map((item) => ({
                            question_id: q.question_id,
                            option_value: String(item),
                          }));
                        }),
                        {
                          onSuccess: () => {
                            setValues({});
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
                    onChange={setValues}
                    actor={actor}
                    errors={errors}
                  />
                  <Button title="Tạo bệnh án" loading={create.isPending} onPress={submit} />
                </>
              ) : null}
              <Button
                title="Quay lại phân loại"
                variant="ghost"
                disabled={create.isPending}
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
