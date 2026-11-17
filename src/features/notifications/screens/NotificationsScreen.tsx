import { useRouter } from 'expo-router';
import { Bell, CheckCheck, Trash2 } from 'lucide-react-native';
import { useState } from 'react';
import { ScrollView, View } from 'react-native';

import { getErrorMessage } from '@/core/api';
import { getRoleGroup, useSession } from '@/core/auth';
import { Button, ConfirmDialog, ContentModal, IconButton, PaginatedList, Screen, ScreenTitle, Text, toast } from '@/shared/ui';
import { formatDateTime } from '@/shared/utils';

import { getNotificationRoute } from '../components/notification-navigation';
import { NotificationCard } from '../components/NotificationCard';
import { useDeleteNotification, useMarkAllNotificationsRead, useMarkNotificationRead, useNotifications } from '../hooks/useNotifications';
import type { Notification } from '../types';

export function NotificationsScreen() {
  const router = useRouter();
  const auth = useSession();
  const query = useNotifications();
  const markRead = useMarkNotificationRead();
  const markAllRead = useMarkAllNotificationsRead();
  const remove = useDeleteNotification();
  const [pendingDelete, setPendingDelete] = useState<Notification | null>(null);
  const [opened, setOpened] = useState<Notification | null>(null);
  const busy = markRead.isPending || markAllRead.isPending || remove.isPending;

  const openNotification = (notification: Notification) => {
    if (busy || auth.status !== 'signedIn') return;
    const route = getNotificationRoute(notification, getRoleGroup(auth.user.role_id));
    const go = () => {
      if (route) router.push({ pathname: route, params: { reference_id: String(notification.reference_id) } });
      else setOpened(notification);
    };
    if (notification.is_read === 1) go();
    else markRead.mutate(notification.id, { onSuccess: go });
  };

  return (
    <Screen scroll={false} header={
      <ScreenTitle title="Thông báo" right={
        <IconButton
          icon={CheckCheck}
          variant="soft"
          accessibilityLabel="Đánh dấu tất cả đã đọc"
          disabled={!query.isSuccess || query.unreadCount === 0 || busy}
          onPress={() => markAllRead.mutate(undefined, { onSuccess: () => toast.success('Đã đánh dấu tất cả là đã đọc.', undefined, 'fade') })}
        />
      } />
    }>
      <View className="pb-3">
        <Text tone="muted" accessibilityLiveRegion="polite">
          {query.data ? `${query.total} thông báo · ${query.unreadCount} chưa đọc` : query.isLoading ? 'Đang tải hộp thư…' : 'Hộp thư thông báo'}
        </Text>
        {busy && <Text variant="caption" tone="primary">Đang cập nhật thông báo…</Text>}
      </View>
      <PaginatedList
        {...query.listProps}
        padded={false}
        keyExtractor={(item) => String(item.id)}
        renderItem={({ item }) => <NotificationCard notification={item} disabled={busy} onPress={() => openNotification(item)} onDelete={() => setPendingDelete(item)} />}
        emptyIcon={Bell}
        emptyTitle="Chưa có thông báo"
        emptyDescription="Thông báo về lịch khám, xét nghiệm và đơn thuốc sẽ xuất hiện tại đây."
      />
      {query.error && query.items.length > 0 && !query.isFetchNextPageError && (
        <View className="gap-2 py-2">
          <Text tone="danger" variant="caption">Chưa làm mới được hộp thư. {getErrorMessage(query.error)}</Text>
          <Button title="Thử làm mới" size="sm" variant="soft" loading={query.isRefetching} onPress={() => query.refetch()} />
        </View>
      )}
      <ConfirmDialog
        visible={pendingDelete !== null}
        icon={Trash2}
        destructive
        title="Xóa thông báo?"
        description="Thông báo sẽ bị xóa khỏi hộp thư. Đơn thuốc, xét nghiệm liên quan vẫn được giữ lại."
        confirmLabel="Xóa thông báo"
        loading={remove.isPending}
        onCancel={() => setPendingDelete(null)}
        onConfirm={() => {
          if (!pendingDelete || remove.isPending) return;
          remove.mutate(pendingDelete.id, { onSuccess: () => { setPendingDelete(null); toast.success('Đã xóa thông báo.', undefined, 'fade'); } });
        }}
      />
      <ContentModal visible={opened !== null} onClose={() => setOpened(null)} title="Nội dung thông báo">
        <ScrollView className="shrink" contentContainerClassName="gap-3 pb-4">
          <Text variant="h3">{opened?.title}</Text>
          <Text>{opened?.body}</Text>
          <Text variant="caption" tone="muted">{opened && formatDateTime(opened.created_at)}</Text>
          {opened?.type !== 'general' && <Text variant="caption" tone="muted">Chưa có màn chi tiết phù hợp cho thông báo này. Bạn vẫn có thể đọc toàn bộ nội dung tại đây.</Text>}
        </ScrollView>
      </ContentModal>
    </Screen>
  );
}
