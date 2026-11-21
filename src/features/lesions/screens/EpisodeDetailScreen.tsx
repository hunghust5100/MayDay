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
  InfoRow,
  ListItem,
  Screen,
  Spinner,
  Text,
  toast,
} from '@/shared/ui';
import { formatDateTime } from '@/shared/utils';
import { lesionsApi } from '../api/lesions-api';
import { ObservationForm, observationPayload } from '../components/ObservationForm';
import { useEpisode, useLesionMutation, useLocations } from '../hooks/useLesions';
import type { EpisodeInput, LocationInput } from '../types';

export function EpisodeDetailScreen() {
  const { episodeId } = useLocalSearchParams<{ episodeId: string }>();
  const router = useRouter();
  const episode = useEpisode(episodeId ?? '');
  const locations = useLocations(episodeId ?? '');
  const record = useRecordDetail(episode.data?.medical_record_id ?? 0);
  const [modal, setModal] = useState<'episode' | 'location' | null>(null);
  const [confirm, setConfirm] = useState(false);
  const edit = useLesionMutation((body: Omit<EpisodeInput, 'medical_record_id'>) =>
    lesionsApi.editEpisode(episodeId, body),
  );
  const createLocation = useLesionMutation((body: LocationInput) => lesionsApi.createLocation(body));
  const remove = useLesionMutation(() => lesionsApi.deleteEpisode(episodeId));
  const writable = record.data?.status === 'pending' || record.data?.status === 'in_progress';
  const close = () => {
    if (!edit.isPending && !createLocation.isPending) setModal(null);
  };
  return (
    <Screen
      header={<AppHeader title={episode.data?.name ?? 'Đợt tổn thương'} onBack={router.back} />}
      refreshControl={
        <RefreshControl
          refreshing={episode.isRefetching || locations.isRefetching}
          onRefresh={() => {
            episode.refetch();
            locations.refetch();
            record.refetch();
          }}
        />
      }
    >
      {episode.isLoading ? (
        <Spinner />
      ) : episode.isError ? (
        <ErrorState description={episode.error.message} onRetry={() => episode.refetch()} />
      ) : episode.data ? (
        <View className="gap-4">
          <Card className="gap-2">
            <InfoRow
              label="Xuất hiện"
              value={episode.data.occurred_at ? formatDateTime(episode.data.occurred_at) : null}
            />
            <InfoRow
              label="Bối cảnh"
              value={[...episode.data.context_tags, episode.data.context_other].filter(Boolean).join(', ')}
            />
            <InfoRow label="Thuốc đã dùng" value={episode.data.medication_name} />
            <InfoRow
              label="Thời gian dùng trước đó"
              value={
                episode.data.medication_taken_ago
                  ? `${episode.data.medication_taken_ago} ${episode.data.medication_unit ?? ''}`
                  : null
              }
            />
            <Text>{episode.data.description || 'Chưa có mô tả'}</Text>
          </Card>
          {record.isError && (
            <ErrorState description={record.error.message} onRetry={() => record.refetch()} />
          )}
          {record.data && !writable && <Text tone="muted">Bệnh án đã đóng. Chỉ có thể xem dữ liệu.</Text>}
          {writable && (
            <>
              <Button title="Sửa đợt tổn thương" variant="soft" onPress={() => setModal('episode')} />
              <Button title="Thêm vị trí" onPress={() => setModal('location')} />
            </>
          )}
          <Text variant="h3">Vị trí tổn thương</Text>
          {locations.isLoading ? (
            <Spinner />
          ) : locations.isError ? (
            <ErrorState onRetry={() => locations.refetch()} />
          ) : !locations.data?.length ? (
            <EmptyState
              title="Chưa ghi nhận vị trí"
              description="Thêm vị trí để theo dõi ảnh khởi phát, đỉnh điểm và hồi phục."
            />
          ) : (
            locations.data.map((location) => (
              <Card key={location.lesion_location_id}>
                <ListItem
                  title={location.body_part}
                  description={
                    location.occurred_at ? formatDateTime(location.occurred_at) : 'Chưa rõ thời điểm'
                  }
                  onPress={() =>
                    router.push({
                      pathname: '/patient/lesions/[episodeId]/locations/[locationId]',
                      params: { episodeId, locationId: location.lesion_location_id },
                    })
                  }
                />
              </Card>
            ))
          )}
          {writable && (
            <Button title="Xóa đợt tổn thương" variant="danger" onPress={() => setConfirm(true)} />
          )}
        </View>
      ) : null}
      <ContentModal
        visible={modal !== null}
        title={modal === 'episode' ? 'Sửa đợt tổn thương' : 'Thêm vị trí'}
        onClose={close}
      >
        <ScrollView keyboardShouldPersistTaps="handled">
          {modal && (
            <ObservationForm
              key={modal}
              mode={modal === 'episode' ? 'episode' : 'location'}
              initial={modal === 'episode' ? episode.data : undefined}
              loading={edit.isPending || createLocation.isPending}
              onCancel={close}
              onSubmit={(values) => {
                const common = observationPayload(values);
                if (modal === 'episode')
                  edit.mutate(
                    {
                      ...common,
                      name: values.name,
                      description: values.description || null,
                      medication_taken_ago:
                        values.medicationInterval == null ? null : String(values.medicationInterval),
                    },
                    {
                      onSuccess: () => {
                        setModal(null);
                        toast.success('Đã cập nhật đợt tổn thương.');
                      },
                    },
                  );
                else
                  createLocation.mutate(
                    {
                      ...common,
                      episode_id: episodeId,
                      body_part: values.body_part,
                      medication_take:
                        values.medicationInterval == null ? null : String(values.medicationInterval),
                    },
                    {
                      onSuccess: (location) => {
                        setModal(null);
                        router.push({
                          pathname: '/patient/lesions/[episodeId]/locations/[locationId]',
                          params: { episodeId, locationId: location.lesion_location_id },
                        });
                      },
                    },
                  );
              }}
            />
          )}
        </ScrollView>
      </ContentModal>
      <ConfirmDialog
        visible={confirm}
        title="Xóa cả đợt tổn thương?"
        description="Các vị trí và bản ghi ảnh tiến triển trong đợt này sẽ bị xóa. Ảnh gốc trong kho vẫn được giữ lại."
        destructive
        loading={remove.isPending}
        onCancel={() => setConfirm(false)}
        onConfirm={() =>
          remove.mutate(undefined, {
            onSuccess: () => {
              toast.success('Đã xóa đợt tổn thương.');
              router.back();
            },
          })
        }
      />
    </Screen>
  );
}
