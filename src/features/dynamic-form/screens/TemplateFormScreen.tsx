import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';

import { getErrorMessage, isApiError } from '@/core/api';
import { AppHeader, ErrorState, Screen, Spinner, toast } from '@/shared/ui';

import { TemplateForm, type TemplateFormValues } from '../components/TemplateForm';
import { useCreateTemplate, useTemplate, useUpdateTemplate } from '../hooks/useTemplates';

function readCode(value: string | string[] | undefined) {
  const raw = Array.isArray(value) ? value[0] : value;
  // Expo Router đã decode URL parameters; API client tự encode lại path segment.
  return raw || undefined;
}

export function TemplateFormScreen({ mode }: { mode: 'create' | 'edit' }) {
  const router = useRouter();
  const code = readCode(useLocalSearchParams<{ id?: string | string[] }>().id);
  const detail = useTemplate(mode === 'edit' ? code : undefined);
  const create = useCreateTemplate();
  const update = useUpdateTemplate(code ?? '');
  const mutation = mode === 'create' ? create : update;
  const back = () => router.canGoBack() ? router.back() : router.replace('/admin/templates');
  const [errorMessage, setErrorMessage] = useState<string>();
  const [duplicateCode, setDuplicateCode] = useState(false);

  const submit = (values: TemplateFormValues) => {
    setErrorMessage(undefined);
    setDuplicateCode(false);
    if (mode === 'create') {
      create.mutate({ ...values, description: values.description || undefined }, {
        onSuccess: (template) => { toast.success('Đã tạo mẫu phiếu.', undefined, 'fade'); router.replace(`/admin/templates/${encodeURIComponent(template.code_template)}`); },
        onError: (error) => { setDuplicateCode(isApiError(error) && error.code === '4102'); setErrorMessage(getErrorMessage(error)); },
      });
    } else {
      const { code_template: _code, ...body } = values;
      update.mutate(body, {
        onSuccess: () => {
          toast.success('Đã cập nhật mẫu phiếu.', undefined, 'fade');
          if (router.canGoBack()) router.back();
          else router.replace({ pathname: '/admin/templates/[id]', params: { id: code ?? '' } });
        },
        onError: (error) => setErrorMessage(getErrorMessage(error)),
      });
    }
  };

  if (mode === 'edit' && !code) {
    return <Screen header={<AppHeader title="Sửa mẫu phiếu" onBack={back} />}><ErrorState fill title="Mã mẫu không hợp lệ" /></Screen>;
  }
  if (mode === 'edit' && detail.isPending) {
    return <Screen header={<AppHeader title="Sửa mẫu phiếu" onBack={back} />}><Spinner fill /></Screen>;
  }
  if (mode === 'edit' && !detail.data) {
    return <Screen header={<AppHeader title="Sửa mẫu phiếu" onBack={back} />}><ErrorState fill description={getErrorMessage(detail.error)} onRetry={() => detail.refetch()} /></Screen>;
  }

  return (
    <Screen header={<AppHeader title={mode === 'create' ? 'Tạo mẫu phiếu' : 'Sửa mẫu phiếu'} onBack={back} />}>
      <TemplateForm key={mode === 'edit' ? code : 'new'} initial={mode === 'edit' ? detail.data : undefined} loading={mutation.isPending} errorMessage={errorMessage} duplicateCode={duplicateCode} onSubmit={submit} />
    </Screen>
  );
}
