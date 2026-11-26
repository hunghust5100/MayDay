import { useRouter } from 'expo-router';
import { Bell, CheckCheck, Trash2 } from 'lucide-react-native';
import { useState } from 'react';
import { ScrollView, View } from 'react-native';

import { getErrorMessage } from '@/core/api';
import { getRoleGroup, useSession } from '@/core/auth';
import { useOnline } from '@/core/providers';
import { Button, ContentModal, IconButton, PaginatedList, Screen, ScreenTitle, Text, toast } from '@/shared/ui';
import { formatDateTime } from '@/shared/utils';

import { getNotificationRoute } from '../components/notification-navigation';
import { NotificationCard } from '../components/NotificationCard';
import { usePushNotifications } from '../components/PushNotifications';
import { useDeleteNotification, useMarkAllNotificationsRead, useMarkNotificationRead, useNotifications } from '../hooks/useNotifications';
import type { Notification } from '../types';

export function NotificationsScreen() {
  const router = useRouter();
  const auth = useSession();
  const query = useNotifications();
  const online = useOnline();
  const push = usePushNotifications();
  const markRead = useMarkNotificationRead();
  const markAllRead = useMarkAllNotificationsRead();
  const remove = useDeleteNotification();
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [opened, setOpened] = useState<Notification | null>(null);
  const busy = markRead.isPending || markAllRead.isPending || remove.isPending;
  const relatedRoute = opened && auth.status === 'signedIn'
    ? getNotificationRoute(opened, getRoleGroup(auth.user.role_id))
    : null;

  const openNotification = (notification: Notification) => {
    if (auth.status !== 'signedIn') return;
    setOpened(notification);
    if (online && !markAllRead.isPending && notification.is_read !== 1) markRead.mutate(notification.id);
  };
  const closeNotification = () => {
    if (remove.isPending) return;
    setOpened(null);
    setConfirmDelete(false);
  };

  return (
    <Screen scroll={false} header={
      <ScreenTitle title="Thông báo" right={
        <IconButton
          icon={CheckCheck}
          variant="soft"
          accessibilityLabel="Đánh dấu tất cả đã đọc"
          disabled={!online || !query.isSuccess || query.unreadCount === 0 || busy}
          onPress={() => markAllRead.mutate(undefined, { onSuccess: () => toast.success('Đã đánh dấu tất cả là đã đọc.', undefined, 'fade') })}
        />
      } />
    }>
      <View className="pb-3">
        <Text tone="muted" accessibilityLiveRegion="polite">
          {query.data ? `${query.total} thông báo · ${query.unreadCount} chưa đọc` : query.isLoading ? 'Đang tải hộp thư…' : 'Hộp thư thông báo'}
        </Text>
        {push.status === 'enabled' && <Text variant="caption" tone="success">Thông báo thiết bị đang bật</Text>}
        {online && (push.status === 'ready' || push.status === 'denied' || push.status === 'error') && (
          <Button
            title={push.status === 'denied' ? 'Mở cài đặt thông báo' : push.status === 'error' ? 'Thử bật thông báo lại' : 'Bật thông báo trên thiết bị'}
            className="mt-2 self-start"
            size="sm"
            variant="soft"
            onPress={push.enable}
          />
        )}
      </View>
      <PaginatedList
        {...query.listProps}
        padded={false}
        keyExtractor={(item) => String(item.id)}
        renderItem={({ item }) => <NotificationCard notification={item} onPress={() => openNotification(item)} />}
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
      <ContentModal visible={opened !== null} onClose={closeNotification} title={confirmDelete ? 'Xóa thông báo?' : 'Thông báo'}>
        <ScrollView className="shrink" contentContainerClassName="gap-3 pb-1">
          {confirmDelete ? (
            <>
              <Text tone="muted">Thông báo sẽ được xóa khỏi hộp thư.</Text>
              <Button
                title="Xóa thông báo"
                variant="danger"
                fullWidth
                disabled={!online}
                loading={remove.isPending}
                onPress={() => {
                  if (!opened) return;
                  remove.mutate(opened.id, { onSuccess: () => {
                    setOpened(null);
                    setConfirmDelete(false);
                    toast.success('Đã xóa thông báo.', undefined, 'fade');
                  } });
                }}
              />
              <Button title="Quay lại" variant="ghost" fullWidth disabled={remove.isPending} onPress={() => setConfirmDelete(false)} />
            </>
          ) : (
            <>
              <Text variant="caption" tone="muted">{opened && formatDateTime(opened.created_at)}</Text>
              <Text variant="h3">{opened?.title}</Text>
              <Text>{opened?.body}</Text>
              {relatedRoute && (
                <Button
                  title={opened?.type === 'prescription' ? 'Xem đơn thuốc' : 'Xem xét nghiệm'}
                  fullWidth
                  onPress={() => {
                    closeNotification();
                    router.push(relatedRoute);
                  }}
                />
              )}
              {online && <Button title="Xóa thông báo" leftIcon={Trash2} variant="danger-soft" size="sm" onPress={() => setConfirmDelete(true)} />}
            </>
          )}
        </ScrollView>
      </ContentModal>
    </Screen>
  );
}
