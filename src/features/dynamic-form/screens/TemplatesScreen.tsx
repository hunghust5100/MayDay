import { useRouter } from 'expo-router';
import { FilePlus2, FileText, Trash2 } from 'lucide-react-native';
import { useState } from 'react';
import { View } from 'react-native';

import { getErrorMessage } from '@/core/api';
import { AppHeader, Badge, Button, Card, IconButton, PaginatedList, Screen, SegmentedControl, Text } from '@/shared/ui';
import { formatDateTime } from '@/shared/utils';

import { TemplateDeleteDialog } from '../components/TemplateDeleteDialog';
import { useTemplates } from '../hooks/useTemplates';
import type { TemplateSummary } from '../types';

type FilterValue = 'all' | 'active' | 'inactive';

function TemplateCard({ template, onPress, onDelete }: { template: TemplateSummary; onPress: () => void; onDelete: () => void }) {
  const active = template.is_active === 1;
  return (
    <Card className="gap-3">
      <View className="flex-row items-start gap-2">
        <View className="min-w-0 flex-1 gap-1">
          <Text variant="h3">{template.name}</Text>
          <Text variant="caption" tone="muted">{template.code_template}</Text>
        </View>
        <IconButton icon={Trash2} variant="ghost" accessibilityLabel={`Xóa mẫu ${template.name}`} onPress={onDelete} />
      </View>
      {Boolean(template.description) && <Text tone="muted" numberOfLines={2}>{template.description}</Text>}
      <View className="flex-row flex-wrap items-center gap-2">
        <Badge label={active ? 'Đang hoạt động' : 'Ngừng hoạt động'} tone={active ? 'success' : 'neutral'} />
        <Text variant="caption" tone="muted">Phiên bản {template.version}</Text>
      </View>
      <Text variant="caption" tone="muted">Cập nhật: {formatDateTime(template.updated_at)}</Text>
      <Button title="Xem chi tiết" variant="soft" size="sm" onPress={onPress} accessibilityLabel={`Xem mẫu ${template.name}`} />
    </Card>
  );
}

export function TemplatesScreen() {
  const router = useRouter();
  const [filter, setFilter] = useState<FilterValue>('all');
  const [pendingDelete, setPendingDelete] = useState<TemplateSummary | null>(null);
  const query = useTemplates(filter === 'all' ? {} : { is_active: filter === 'active' ? 1 : 0 });
  return (
    <Screen scroll={false} header={
      <AppHeader title="Mẫu phiếu khám" onBack={() => router.canGoBack() ? router.back() : router.replace('/admin')}
        right={<IconButton icon={FilePlus2} variant="soft" accessibilityLabel="Tạo mẫu phiếu" onPress={() => router.push('/admin/templates/new')} />} />
    }>
      <View className="gap-3 pb-3">
        <Text tone="muted">{query.data ? `${query.total} mẫu phiếu` : 'Quản lý mẫu phiếu khám'}</Text>
        <SegmentedControl
          options={[
            { value: 'all' as const, label: 'Tất cả' },
            { value: 'active' as const, label: 'Đang hoạt động' },
            { value: 'inactive' as const, label: 'Ngừng hoạt động' },
          ]}
          value={filter} onChange={setFilter}
        />
      </View>
      <PaginatedList
        {...query.listProps} padded={false} keyExtractor={(item) => item.code_template}
        renderItem={({ item }) => (
          <TemplateCard template={item}
            onPress={() => router.push({ pathname: '/admin/templates/[id]', params: { id: item.code_template } })}
            onDelete={() => setPendingDelete(item)} />
        )}
        emptyIcon={FileText} emptyTitle={filter === 'all' ? 'Chưa có mẫu phiếu' : 'Không có mẫu phù hợp'}
        emptyDescription={filter === 'all' ? 'Dùng nút tạo mẫu phía trên để bắt đầu.' : 'Thử chuyển sang trạng thái khác hoặc xem tất cả.'}
      />
      {query.error && query.items.length > 0 && !query.isFetchNextPageError && (
        <View className="gap-2 py-2">
          <Text tone="danger" variant="caption">Chưa làm mới được danh sách. {getErrorMessage(query.error)}</Text>
          <Button title="Thử làm mới" size="sm" variant="soft" loading={query.isRefetching} onPress={() => query.refetch()} />
        </View>
      )}
      <TemplateDeleteDialog template={pendingDelete} onClose={() => setPendingDelete(null)} onDeleted={() => {}} />
    </Screen>
  );
}
