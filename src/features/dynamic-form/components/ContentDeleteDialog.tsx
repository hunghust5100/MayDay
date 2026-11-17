import { getErrorMessage, isApiError } from '@/core/api';
import { Button, Dialog, Text, toast } from '@/shared/ui';

import { useDeleteQuestion, useDeleteSection } from '../hooks/useTemplates';
import type { TemplateQuestion, TemplateSection } from '../types';
import { descendantIds } from '../utils/tree';

export type DeleteTarget = { section: TemplateSection; question?: TemplateQuestion };
export function ContentDeleteDialog({ target, onClose, onEditStatus }: { target: DeleteTarget; onClose: () => void; onEditStatus: () => void }) {
  const sectionMutation = useDeleteSection();
  const questionMutation = useDeleteQuestion();
  const mutation = target.question ? questionMutation : sectionMutation;
  const inUse = isApiError(mutation.error) && mutation.error.code === '4105';
  const count = target.question ? descendantIds(target.section.questions, target.question.question_id).size : target.section.questions.length;
  return <Dialog visible title={inUse ? 'Mẫu đã được sử dụng' : target.question ? 'Xóa câu hỏi?' : 'Xóa phần?'} destructive
    onClose={() => { if (!mutation.isPending) onClose(); }}
    description={inUse ? 'Mẫu này đã được dùng trong bệnh án nên không thể xóa nội dung. Hãy tạo mẫu mới nếu cần thay đổi. Ngừng hoạt động chỉ dừng sử dụng cho bệnh án mới, không cho phép xóa dữ liệu cũ.'
      : `Xóa vĩnh viễn ${count} câu hỏi, gồm cả câu con/cháu và mọi lựa chọn của chúng. Các điều kiện tham chiếu từ câu khác cần được rà soát lại.`}
    actions={<>
      {inUse ? <Button title="Chuyển sang sửa trạng thái" onPress={onEditStatus} /> : <Button title={target.question ? 'Xóa câu hỏi' : 'Xóa phần'} variant="danger" loading={mutation.isPending} onPress={() => {
        if (mutation.isPending) return;
        const options = { onSuccess: () => { toast.success('Đã xóa nội dung.', undefined, 'fade'); onClose(); } };
        if (target.question) questionMutation.mutate(target.question.question_id, options);
        else sectionMutation.mutate(target.section.section_id, options);
      }} />}
      <Button title={inUse ? 'Đóng' : 'Hủy'} variant="ghost" disabled={mutation.isPending} onPress={onClose} />
    </>}>
    <Text weight="semibold">{target.question?.question_text ?? target.section.title}</Text>
    {mutation.error && !inUse && <Text tone="danger" accessibilityRole="alert">{getErrorMessage(mutation.error)}</Text>}
  </Dialog>;
}
