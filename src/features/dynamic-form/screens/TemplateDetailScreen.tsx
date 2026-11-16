import { useLocalSearchParams, useRouter } from 'expo-router';
import { FileText, Pencil, Trash2 } from 'lucide-react-native';
import { useState } from 'react';
import { View } from 'react-native';

import { getErrorMessage } from '@/core/api';
import { AppHeader, Badge, Button, Card, ErrorState, Icon, IconButton, Screen, Spinner, Text } from '@/shared/ui';
import { formatDateTime } from '@/shared/utils';

import { ContentDeleteDialog, type DeleteTarget } from '../components/ContentDeleteDialog';
import { TemplateContentEditor, type EditTarget } from '../components/TemplateContentEditor';
import { TemplateDeleteDialog } from '../components/TemplateDeleteDialog';
import { TemplateTree } from '../components/TemplateTree';
import { TemplatePreview } from '../components/TemplatePreview';
import { useTemplate } from '../hooks/useTemplates';

function readId(value: string | string[] | undefined) {
  return (Array.isArray(value) ? value[0] : value) || undefined;
}

export function TemplateDetailScreen() {
  const router = useRouter();
  const code = readId(useLocalSearchParams<{ id?: string | string[] }>().id);
  const query = useTemplate(code);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [editing, setEditing] = useState<EditTarget | null>(null);
  const [deleting, setDeleting] = useState<DeleteTarget | null>(null);
  const [preview, setPreview] = useState(false);

  const back = () => router.canGoBack() ? router.back() : router.replace('/admin/templates');
  const header = <AppHeader title="Chi tiết mẫu phiếu" onBack={back} />;
  if (!code) return <Screen header={header}><ErrorState fill title="Mã mẫu không hợp lệ" /></Screen>;
  if (query.isPending) return <Screen header={header}><Spinner fill /></Screen>;
  if (!query.data) return <Screen header={header}><ErrorState fill description={query.error ? getErrorMessage(query.error) : undefined} onRetry={() => query.refetch()} /></Screen>;

  const template = query.data;
  const editStatus = () => router.push({ pathname: '/admin/templates/[id]/edit', params: { id: template.code_template } });
  if (editing) return <TemplateContentEditor template={template} target={editing} onClose={() => setEditing(null)} />;
  if (preview) return <TemplatePreview template={template} onClose={() => setPreview(false)} />;
  return (
    <Screen
      header={
        <AppHeader title="Chi tiết mẫu phiếu" onBack={back} right={
          <IconButton icon={Trash2} variant="ghost" accessibilityLabel="Xóa mẫu phiếu" onPress={() => setDeleteOpen(true)} />
        } />
      }
    >
      {query.error && <ErrorState title="Chưa làm mới được mẫu phiếu" description={getErrorMessage(query.error)} onRetry={() => query.refetch()} />}
      <Card padding="lg" className="gap-3">
        <View className="flex-row items-start gap-3">
          <View className="h-12 w-12 items-center justify-center rounded-xl bg-primary-soft"><Icon as={FileText} size={24} color="primary-strong" /></View>
          <View className="min-w-0 flex-1 gap-1"><Text variant="h2">{template.name}</Text><Text tone="muted">{template.code_template}</Text></View>
        </View>
        {Boolean(template.description) && <Text tone="muted">{template.description}</Text>}
        <View className="flex-row flex-wrap items-center gap-2">
          <Badge label={template.is_active === 1 ? 'Đang hoạt động' : 'Ngừng hoạt động'} tone={template.is_active === 1 ? 'success' : 'neutral'} />
          <Badge label={`Phiên bản ${template.version}`} tone="primary" />
        </View>
        <Text variant="caption" tone="subtle">Cập nhật: {formatDateTime(template.updated_at)}</Text>
      </Card>

      <Button title="Xem thử mẫu phiếu" variant="soft" className="mt-4" onPress={() => setPreview(true)} />
      <TemplateTree template={template} onSection={(section) => setEditing({ kind: 'section', section })}
        onQuestion={(section, question) => setEditing({ kind: 'question', section, question })}
        onDeleteSection={(section) => setDeleting({ section })} onDeleteQuestion={(section, question) => setDeleting({ section, question })} />
      {deleting && <ContentDeleteDialog target={deleting} onClose={() => setDeleting(null)} onEditStatus={() => { setDeleting(null); editStatus(); }} />}
      <Text variant="caption" tone="muted" className="mt-3">{template.sections.length} phần nội dung</Text>
      <Button title="Sửa thông tin mẫu" variant="outline" leftIcon={Pencil} fullWidth onPress={() => router.push({ pathname: '/admin/templates/[id]/edit', params: { id: template.code_template } })} className="mt-5" />
      <TemplateDeleteDialog template={deleteOpen ? template : null} onClose={() => setDeleteOpen(false)} onDeleted={() => router.replace('/admin/templates')} />
    </Screen>
  );
}
