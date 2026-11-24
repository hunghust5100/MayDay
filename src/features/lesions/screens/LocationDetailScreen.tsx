import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { RefreshControl, ScrollView, View } from 'react-native';
import { useRecordDetail } from '@/features/medical-records';
import {
  AppHeader,
  Button,
  Card,
  ConfirmDialog,
  ContentModal,
  EmptyState,
  ErrorState,
  ImageThumbnailGrid,
  ImageViewer,
  InfoRow,
  Screen,
  Spinner,
  Text,
  toast,
} from '@/shared/ui';
import { formatDateTime } from '@/shared/utils';
import { lesionsApi } from '../api/lesions-api';
import { ObservationForm, observationPayload } from '../components/ObservationForm';
import { MILESTONES, PhotoForm } from '../components/PhotoForm';
import { useEpisode, useLesionMutation, useLesionPhotos, useLocations } from '../hooks/useLesions';
import type { LesionPhoto, LocationInput, PhotoInput } from '../types';

export function LocationDetailScreen() {
  const { episodeId, locationId } = useLocalSearchParams<{ episodeId: string; locationId: string }>();
  const router = useRouter();
  const back = () => {
    if (router.canGoBack()) router.back();
    else router.replace({ pathname: '/patient/lesions/[episodeId]', params: { episodeId } });
  };
  const episode = useEpisode(episodeId ?? '');
  const locations = useLocations(episodeId ?? '');
  const photos = useLesionPhotos(locationId ?? '');
  const record = useRecordDetail(episode.data?.medical_record_id ?? 0);
  const location = locations.data?.find((l) => l.lesion_location_id === locationId);
  const [modal, setModal] = useState<'location' | 'photo' | null>(null);
  const [photoDraft, setPhotoDraft] = useState<LesionPhoto | undefined>();
  const [confirm, setConfirm] = useState<{ kind: 'location' | 'photo'; id: string } | null>(null);
  const [viewer, setViewer] = useState<number | null>(null);
  const editLocation = useLesionMutation((body: Omit<LocationInput, 'episode_id'>) =>
    lesionsApi.editLocation(locationId, body),
  );
  const savePhoto = useLesionMutation((body: PhotoInput) =>
    photoDraft ? lesionsApi.editPhoto(photoDraft.photo_id, body) : lesionsApi.createPhoto(body),
  );
  const remove = useLesionMutation((target: { kind: 'location' | 'photo'; id: string }) =>
    target.kind === 'location' ? lesionsApi.deleteLocation(target.id) : lesionsApi.deletePhoto(target.id),
  );
  const writable = record.data?.status === 'pending' || record.data?.status === 'in_progress';
  const close = () => {
    if (!editLocation.isPending && !savePhoto.isPending) setModal(null);
  };
  const rows = photos.data ?? [];
  return (
    <Screen
      header={<AppHeader title="Vị trí tổn thương" onBack={back} />}
      refreshControl={
        <RefreshControl
          refreshing={photos.isRefetching || locations.isRefetching}
          onRefresh={() => {
            photos.refetch();
            locations.refetch();
            record.refetch();
          }}
        />
      }
    >
      {episode.isLoading || locations.isLoading ? (
        <Spinner />
      ) : episode.isError || locations.isError ? (
        <ErrorState
          onRetry={() => {
            episode.refetch();
            locations.refetch();
          }}
        />
      ) : !location || !episode.data ? (
        <EmptyState title="Không tìm thấy vị trí trong đợt này" />
      ) : (
        <View className="gap-3 roomy:gap-4">
          <Card className="gap-2">
            <Text variant="h2" accessibilityRole="header">{location.body_part}</Text>
            <Text tone="muted">{episode.data.name}</Text>
            <InfoRow
              label="Xuất hiện"
              value={location.occurred_at ? formatDateTime(location.occurred_at) : null}
            />
            <InfoRow
              label="Bối cảnh"
              value={[...location.context_tags, location.context_other].filter(Boolean).join(', ')}
            />
            <InfoRow label="Thuốc đã dùng" value={location.medication_name} />
            <InfoRow
              label="Thời gian dùng trước đó"
              value={
                location.medication_take
                  ? `${location.medication_take} ${location.medication_unit ?? ''}`
                  : null
              }
            />
          </Card>
          {record.isError && (
            <ErrorState description={record.error.message} onRetry={() => record.refetch()} />
          )}
          {record.data && !writable && <Text tone="muted">Bệnh án đã đóng. Ảnh và điểm số chỉ đọc.</Text>}
          {writable && (
            <>
              <Button title="Sửa thông tin vị trí" variant="soft" onPress={() => setModal('location')} />
              <Button
                title="Thêm ảnh tiến triển"
                onPress={() => {
                  setPhotoDraft(undefined);
                  setModal('photo');
                }}
              />
            </>
          )}
          <Text variant="h3">So sánh ba mốc tiến triển</Text>
          <Text variant="caption" tone="muted">
            Vuốt ngang để xem các mốc. Chạm ảnh để phóng to.
          </Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 12 }}>
            {MILESTONES.map((milestone) => {
              const photo = rows.find((p) => p.milestone === milestone.value);
              return (
                <View key={milestone.value} style={{ width: 235 }}>
                  <Card className="gap-2">
                    <Text weight="semibold">{milestone.label}</Text>
                    {photo ? (
                      <>
                        <ImageThumbnailGrid
                          columns={1}
                          images={[{ uri: photo.attachment.file_url }]}
                          onPress={() => setViewer(rows.indexOf(photo))}
                        />
                        <Text variant="caption">
                          {photo.taken_at ? formatDateTime(photo.taken_at) : 'Chưa rõ thời điểm'}
                        </Text>
                        <Text variant="caption">
                          Ngứa {photo.itch_score ?? '—'} · Đau {photo.pain_score ?? '—'} · Rát{' '}
                          {photo.burn_score ?? '—'}
                        </Text>
                      </>
                    ) : (
                      <Text tone="muted">Chưa có ảnh ở mốc này</Text>
                    )}
                  </Card>
                </View>
              );
            })}
          </ScrollView>
          <Text variant="h3">Lịch sử ảnh ({rows.length})</Text>
          {photos.isLoading ? (
            <Spinner />
          ) : photos.isError ? (
            <ErrorState description={photos.error.message} onRetry={() => photos.refetch()} />
          ) : !rows.length ? (
            <EmptyState
              title="Chưa có ảnh tiến triển"
              description="Chọn ảnh từ kho hoặc tải ảnh mới cho vị trí này."
            />
          ) : (
            rows.map((photo, index) => (
              <Card key={photo.photo_id} className="gap-3">
                <Text weight="semibold">{MILESTONES.find((m) => m.value === photo.milestone)?.label}</Text>
                <ImageThumbnailGrid
                  columns={2}
                  images={[{ uri: photo.attachment.file_url }]}
                  onPress={() => setViewer(index)}
                />
                <InfoRow label="Chụp lúc" value={photo.taken_at ? formatDateTime(photo.taken_at) : null} />
                <InfoRow
                  label="Ngứa / Đau / Rát"
                  value={`${photo.itch_score ?? '—'} / ${photo.pain_score ?? '—'} / ${photo.burn_score ?? '—'}`}
                />
                {photo.hives_count != null && <InfoRow label="Số nốt sẩn" value={photo.hives_count} />}
                {photo.local_auas != null && (
                  <InfoRow label="AUAS cục bộ do hệ thống cung cấp" value={photo.local_auas} />
                )}
                {photo.annotated_url && (
                  <ImageThumbnailGrid images={[{ uri: photo.annotated_url }]} columns={2} />
                )}
                {writable && (
                  <>
                    <Button
                      title="Sửa mốc và điểm số"
                      variant="soft"
                      onPress={() => {
                        setPhotoDraft(photo);
                        setModal('photo');
                      }}
                    />
                    <Button
                      title="Gỡ ảnh khỏi vị trí"
                      variant="ghost"
                      onPress={() => setConfirm({ kind: 'photo', id: photo.photo_id })}
                    />
                  </>
                )}
              </Card>
            ))
          )}
          {writable && (
            <Button
              title="Xóa vị trí này"
              variant="danger"
              onPress={() => setConfirm({ kind: 'location', id: locationId })}
            />
          )}
        </View>
      )}
      <ImageViewer
        visible={viewer !== null}
        images={rows.map((p) => p.attachment.file_url)}
        initialIndex={viewer ?? 0}
        captions={rows.map((p) => MILESTONES.find((m) => m.value === p.milestone)?.label)}
        onClose={() => setViewer(null)}
      />
      <ContentModal
        visible={modal !== null}
        title={
          modal === 'location' ? 'Sửa vị trí' : photoDraft ? 'Sửa ảnh tiến triển' : 'Thêm ảnh tiến triển'
        }
        onClose={close}
      >
        <ScrollView keyboardShouldPersistTaps="handled">
          {modal === 'location' && (
            <ObservationForm
              mode="location"
              initial={location}
              loading={editLocation.isPending}
              onCancel={close}
              onSubmit={(values) =>
                editLocation.mutate(
                  {
                    ...observationPayload(values),
                    body_part: values.body_part,
                    medication_take:
                      values.medicationInterval == null ? null : String(values.medicationInterval),
                  },
                  {
                    onSuccess: () => {
                      setModal(null);
                      toast.success('Đã cập nhật vị trí.');
                    },
                  },
                )
              }
            />
          )}
          {modal === 'photo' && episode.data && (
            <PhotoForm
              key={photoDraft?.photo_id ?? 'new'}
              episodeId={episodeId}
              locationId={locationId}
              recordId={episode.data.medical_record_id}
              initial={photoDraft}
              loading={savePhoto.isPending}
              onCancel={close}
              onSubmit={(value) =>
                savePhoto.mutate(value, {
                  onSuccess: () => {
                    setModal(null);
                    toast.success('Đã lưu ảnh tiến triển.');
                  },
                })
              }
            />
          )}
        </ScrollView>
      </ContentModal>
      <ConfirmDialog
        visible={confirm !== null}
        title={confirm?.kind === 'location' ? 'Xóa vị trí tổn thương?' : 'Gỡ ảnh tiến triển?'}
        description="Bản ghi theo dõi sẽ bị xóa. Ảnh gốc vẫn còn trong kho để sử dụng lại."
        destructive
        loading={remove.isPending}
        onCancel={() => setConfirm(null)}
        onConfirm={() => {
          if (confirm)
            remove.mutate(confirm, {
              onSuccess: () => {
                const removedLocation = confirm.kind === 'location';
                setConfirm(null);
                setViewer(null);
                toast.success('Đã xóa bản ghi theo dõi.');
                if (removedLocation) back();
              },
            });
        }}
      />
    </Screen>
  );
}
