import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { FlatList, Pressable, ScrollView, View } from 'react-native';
import { Image } from 'expo-image';
import { canUploadMedia, ROLE_IDS, useSession } from '@/core/auth';
import { SearchBar, TextField } from '@/shared/form';
import {
  AppHeader,
  Button,
  Card,
  ConfirmDialog,
  ContentModal,
  EmptyState,
  ErrorState,
  ImageViewer,
  Screen,
  Spinner,
  Text,
  toast,
} from '@/shared/ui';
import { formatDateTime, removeDiacritics } from '@/shared/utils';
import { MediaUploadPanel } from '../components/MediaUploadPanel';
import { useDeleteMedia, useMedia } from '../hooks/useMedia';

export function MediaScreen() {
  const router = useRouter();
  const {
    userId: target,
    recordId,
    recordStatus,
  } = useLocalSearchParams<{
    userId?: string;
    recordId?: string;
    recordStatus?: string;
  }>();
  const { user } = useSession();
  const userId = target && /^[1-9]\d*$/.test(target) ? Number(target) : user?.user_id;
  const allowed = user && (userId === user.user_id || user.role_id !== ROLE_IDS.PATIENT);
  const library = useMedia(allowed ? userId : undefined);
  const remove = useDeleteMedia();
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [uploadOpen, setUploadOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const recordNumber = recordId && /^[1-9]\d*$/.test(recordId) ? Number(recordId) : 0;
  // Status supplied by the originating record screen is a presentation hint.
  // The API checks the current record status and permissions on every upload.
  const canUpload = !recordNumber || (recordStatus !== 'completed' && recordStatus !== 'cancelled');
  const [selected, setSelected] = useState<string | null>(null);
  const [viewer, setViewer] = useState<{ images: string[]; index: number } | null>(null);
  const [confirm, setConfirm] = useState<string | null>(null);
  const term = removeDiacritics(search.trim());
  const items = (library.data ?? []).filter(
    (a) => !term || [a.file_name, a.description, a.category].some((value) => value && removeDiacritics(value).includes(term)),
  );
  const current = library.data?.find((item) => item.id === selected);
  return (
    <Screen
      scroll={false}
      header={
        <AppHeader
          title="Kho ảnh"
          onBack={() => (router.canGoBack() ? router.back() : router.replace('/'))}
        />
      }
    >
      {!allowed ? (
        <EmptyState title="Không có quyền xem kho ảnh này" />
      ) : (
        <FlatList
          style={{ width: '100%', maxWidth: 800, alignSelf: 'center' }}
          data={items}
          numColumns={2}
          keyExtractor={(item) => item.id}
          initialNumToRender={12}
          windowSize={5}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ paddingBottom: 24 }}
          columnWrapperStyle={{ gap: 12 }}
          refreshing={library.isRefetching}
          onRefresh={() => {
            void library.refetch();
          }}
          ListHeaderComponent={
            <View className="gap-4 pb-4">
              {user && userId === user.user_id && canUploadMedia(user.role_id) && (
                <Card className="gap-3">
                  <Button
                    title={uploadOpen ? 'Thu gọn tải ảnh' : 'Tải ảnh mới'}
                    variant="soft"
                    disabled={!canUpload || uploading}
                    onPress={() => setUploadOpen(!uploadOpen)}
                  />
                  {!!recordNumber && !canUpload && (
                    <Text tone="muted">Chỉ tải ảnh gắn với bệnh án đang chờ hoặc đang khám.</Text>
                  )}
                  {canUpload && (
                    <View className={uploadOpen ? "gap-3" : "hidden"}>
                      <TextField
                        label="Phân loại (tùy chọn)"
                        placeholder="VD: tổn thương, phiếu khám"
                        value={category}
                        onChange={setCategory}
                      />
                      <TextField label="Mô tả (tùy chọn)" value={description} onChange={setDescription} />
                      <MediaUploadPanel
                        onBusyChange={setUploading}
                        context={{
                          category: category || undefined,
                          description: description || undefined,
                          medical_record_id: recordNumber || undefined,
                        }}
                      />
                    </View>
                  )}
                </Card>
              )}
              <SearchBar value={search} onChange={setSearch} placeholder="Tìm tên, mô tả, phân loại" />
              <Text variant="h3">
                {items.length} ảnh{search.trim() ? ' phù hợp' : ' trong kho'}
              </Text>
            </View>
          }
          ListEmptyComponent={
            library.isLoading ? (
              <Spinner />
            ) : library.isError ? (
              <ErrorState description={library.error.message} onRetry={() => library.refetch()} />
            ) : (
              <EmptyState
                title={search.trim() ? 'Không tìm thấy ảnh' : 'Kho ảnh còn trống'}
                description={
                  search.trim()
                    ? 'Thử từ khóa khác hoặc xóa từ khóa tìm kiếm.'
                    : 'Tải ảnh đầu tiên để bắt đầu theo dõi.'
                }
              />
            )
          }
          renderItem={({ item }) => (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`Chi tiết ảnh ${item.file_name || item.id}`}
              onPress={() => setSelected(item.id)}
              style={{ flex: 1, maxWidth: '50%', marginBottom: 12 }}
              className="overflow-hidden rounded-card border border-border bg-surface"
            >
              <Image
                source={{ uri: item.file_url }}
                style={{ width: '100%', aspectRatio: 1 }}
                contentFit="cover"
                recyclingKey={item.id}
              />
              <View className="gap-1 p-3">
                <Text weight="semibold" numberOfLines={1}>
                  {item.file_name || `Ảnh ${item.id}`}
                </Text>
                <Text variant="caption" tone="muted" numberOfLines={1}>
                  {item.category || 'Chưa phân loại'}
                </Text>
              </View>
            </Pressable>
          )}
          ListFooterComponent={
            <Text tone="muted">
              Gỡ ảnh khỏi phiếu khám vẫn giữ ảnh gốc trong kho.
            </Text>
          }
        />
      )}
      <ContentModal
        visible={!!current && confirm === null && viewer === null}
        title="Chi tiết ảnh"
        onClose={() => setSelected(null)}
      >
        {current && (
          <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ gap: 12 }}>
            <Text weight="semibold">{current.file_name || `Ảnh ${current.id}`}</Text>
            <Text>{current.description || 'Chưa có mô tả'}</Text>
            <Text tone="muted">
              {current.category || 'Chưa phân loại'} · {formatDateTime(current.created_at)}
            </Text>
            <Button
              title="Xem ảnh đầy đủ"
              onPress={() =>
                setViewer({
                  images: items.map((item) => item.file_url),
                  index: Math.max(
                    0,
                    items.findIndex((item) => item.id === current.id),
                  ),
                })
              }
            />
            {(current.user_id == null ? userId === user?.user_id : current.user_id === user?.user_id) && (
              <Button title="Xóa tệp khỏi kho" variant="danger-soft" onPress={() => setConfirm(current.id)} />
            )}
          </ScrollView>
        )}
      </ContentModal>
      <ImageViewer
        visible={viewer !== null}
        images={viewer?.images ?? []}
        initialIndex={viewer?.index ?? 0}
        onClose={() => setViewer(null)}
      />
      <ConfirmDialog
        visible={confirm !== null}
        title="Xóa tệp ảnh gốc?"
        description="Xóa ảnh gốc và các liên kết. Ảnh trong bệnh án đã đóng được giữ lại."
        destructive
        loading={remove.isPending}
        onCancel={() => setConfirm(null)}
        onConfirm={() => {
          if (confirm)
            remove.mutate(confirm, {
              onSuccess: () => {
                setConfirm(null);
                setSelected(null);
                toast.success('Đã xóa ảnh khỏi kho.');
              },
            });
        }}
      />
    </Screen>
  );
}
