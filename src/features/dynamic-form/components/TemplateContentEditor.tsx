import { getErrorMessage, isApiError } from '@/core/api';
import { AppHeader, Screen, toast } from '@/shared/ui';

import { useCreateQuestion, useCreateSection, useUpdateQuestion, useUpdateSection } from '../hooks/useTemplates';
import type { TemplateDetail, TemplateQuestion, TemplateSection } from '../types';
import { QuestionForm } from './QuestionForm';
import { SectionForm } from './SectionForm';

export type EditTarget = { kind: 'section'; section?: TemplateSection } | { kind: 'question'; section: TemplateSection; question?: TemplateQuestion };
export const contentErrorMessage = (error: unknown) => isApiError(error) && error.code === '4105'
  ? 'Mẫu đã được dùng trong bệnh án: không thể đổi loại hoặc xóa lựa chọn. Hãy tạo mẫu mới nếu cần thay đổi. Ngừng hoạt động mẫu cũ không cho phép xóa dữ liệu đã được sử dụng.'
  : error ? getErrorMessage(error) : undefined;

export function TemplateContentEditor({ template, target, onClose }: { template: TemplateDetail; target: EditTarget; onClose: () => void }) {
  const createSection = useCreateSection(template.code_template);
  const updateSection = useUpdateSection();
  const createQuestion = useCreateQuestion();
  const updateQuestion = useUpdateQuestion();
  const mutation = target.kind === 'section' ? (target.section ? updateSection : createSection) : (target.question ? updateQuestion : createQuestion);
  const success = () => { toast.success('Đã lưu nội dung mẫu phiếu.', undefined, 'fade'); onClose(); };
  return <Screen header={<AppHeader title={target.kind === 'section' ? 'Thiết kế phần' : 'Thiết kế câu hỏi'} onBack={mutation.isPending ? undefined : onClose} />}>
    {target.kind === 'section' ? <SectionForm initial={target.section} nextOrder={Math.max(0, ...template.sections.map((s) => s.order)) + 1}
      loading={mutation.isPending} errorMessage={contentErrorMessage(mutation.error)} onCancel={onClose} onSubmit={(body) => {
        if (mutation.isPending) return;
        if (target.section) updateSection.mutate({ id: target.section.section_id, body }, { onSuccess: success });
        else createSection.mutate(body, { onSuccess: success });
      }} /> : <QuestionForm template={template} section={target.section} initial={target.question}
      loading={mutation.isPending} errorMessage={contentErrorMessage(mutation.error)} onCancel={onClose} onSubmit={(values) => {
        if (mutation.isPending) return;
        const { question_id, ...body } = values;
        if (target.question) updateQuestion.mutate({ id: target.question.question_id, body }, { onSuccess: success });
        else createQuestion.mutate({ sectionId: target.section.section_id, body: { ...body, question_id, options: body.options.map(({ id: _id, ...o }) => o) } }, { onSuccess: success });
      }} />}
  </Screen>;
}
