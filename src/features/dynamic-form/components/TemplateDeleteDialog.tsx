import { useRouter } from 'expo-router';
import { Trash2 } from 'lucide-react-native';

import { getErrorMessage, isApiError } from '@/core/api';
import { Button, Dialog, Text, toast } from '@/shared/ui';

import { useDeleteTemplate } from '../hooks/useTemplates';
import type { TemplateSummary } from '../types';

export function TemplateDeleteDialog({ template, onClose, onDeleted }: {
  template: TemplateSummary | null;
  onClose: () => void;
  onDeleted: () => void;
}) {
  const router = useRouter();
  const remove = useDeleteTemplate();
  const inUse = isApiError(remove.error) && remove.error.code === '4105';
  const close = () => { if (!remove.isPending) { remove.reset(); onClose(); } };
  return (
    <Dialog
      visible={template !== null} onClose={close} title={inUse ? 'Mẫu đã được sử dụng' : 'Xóa mẫu phiếu?'} icon={Trash2} destructive
      description={inUse
        ? 'Mẫu này đã được dùng trong bệnh án nên không thể xóa, kể cả khi ngừng hoạt động. Bạn có thể ngừng hoạt động để không dùng mẫu cho bệnh án mới.'
        : 'Toàn bộ phần, câu hỏi và lựa chọn trong mẫu này sẽ bị xóa vĩnh viễn.'}
      actions={<>
        {inUse ? (
          <Button title="Chuyển sang sửa trạng thái" fullWidth onPress={() => {
            if (!template) return;
            const id = template.code_template;
            close();
            router.push({ pathname: '/admin/templates/[id]/edit', params: { id } });
          }} />
        ) : (
          <Button title="Xóa mẫu phiếu" variant="danger" fullWidth loading={remove.isPending} onPress={() => {
            if (!template || remove.isPending) return;
            remove.mutate(template.code_template, { onSuccess: () => { remove.reset(); onClose(); onDeleted(); toast.success('Đã xóa mẫu phiếu.', undefined, 'fade'); } });
          }} />
        )}
        <Button title={inUse ? 'Đóng' : 'Hủy'} variant="ghost" fullWidth disabled={remove.isPending} onPress={close} />
      </>}
    >
      {template && <Text weight="semibold" numberOfLines={2} align="center">{template.name}</Text>}
      {remove.error && !inUse && <Text tone="danger" accessibilityRole="alert">{getErrorMessage(remove.error)}</Text>}
    </Dialog>
  );
}
