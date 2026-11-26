import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { RefreshControl, ScrollView, View } from 'react-native';
import { RecordSelector, useRecordDetail } from '@/features/medical-records';
import {
  AppHeader,
  Button,
  Card,
  ContentModal,
  EmptyState,
  ErrorState,
  ListItem,
  Screen,
  Spinner,
  Text,
  toast,
} from '@/shared/ui';
import { formatDateTime } from '@/shared/utils';
import { lesionsApi } from '../api/lesions-api';
import { ObservationForm, observationPayload } from '../components/ObservationForm';
import { useEpisodes, useLesionMutation } from '../hooks/useLesions';
import type { EpisodeInput } from '../types';

export function LesionsScreen() {
  const router = useRouter();
  const { recordId: initialId } = useLocalSearchParams<{ recordId?: string }>();
  const [recordId, setRecordId] = useState<number | null>(
    initialId && /^[1-9][0-9]*$/.test(initialId) ? Number(initialId) : null,
  );
  const [open, setOpen] = useState(false);
  const episodes = useEpisodes(recordId ?? undefined);
  const record = useRecordDetail(recordId ?? 0);
  const create = useLesionMutation((body: EpisodeInput) => lesionsApi.createEpisode(body));
  const writable = record.data?.status === 'pending' || record.data?.status === 'in_progress';
  return (
    <Screen
      header={
        <AppHeader
          title="Theo dõi tổn thương da"
          onBack={() => (router.canGoBack() ? router.back() : router.replace('/patient'))}
        />
      }
      refreshControl={
        <RefreshControl
          refreshing={episodes.isRefetching}
          onRefresh={() => {
            void episodes.refetch();
          }}
        />
      }
    >
      <View className="gap-3 roomy:gap-4">
        <RecordSelector value={recordId} onChange={setRecordId} preferActive />
        {record.isError && <ErrorState description={record.error.message} onRetry={() => record.refetch()} />}
        {recordId && !writable && record.data && (
          <Text tone="muted">Chọn bệnh án đang chờ hoặc đang khám để ghi nhận.</Text>
        )}
        <Button
          title="Ghi nhận đợt tổn thương"
          disabled={!recordId || !writable}
          onPress={() => setOpen(true)}
        />
        {episodes.isLoading ? (
          <Spinner />
        ) : episodes.isError ? (
          <ErrorState description={episodes.error.message} onRetry={() => episodes.refetch()} />
        ) : !episodes.data?.length ? (
          <EmptyState title="Chưa có đợt tổn thương" />
        ) : (
          episodes.data.map((episode) => (
            <Card key={episode.episode_id}>
              <ListItem
                title={episode.name}
                description={[
                  episode.occurred_at ? formatDateTime(episode.occurred_at) : 'Chưa rõ thời điểm',
                  episode.description,
                ]
                  .filter(Boolean)
                  .join(' · ')}
                onPress={() =>
                  router.push({
                    pathname: '/patient/lesions/[episodeId]',
                    params: { episodeId: episode.episode_id },
                  })
                }
              />
            </Card>
          ))
        )}
      </View>
      <ContentModal
        visible={open}
        title="Ghi nhận đợt tổn thương"
        onClose={() => {
          if (!create.isPending) setOpen(false);
        }}
      >
        <ScrollView keyboardShouldPersistTaps="handled">
          {open && (
            <ObservationForm
              mode="episode"
              loading={create.isPending}
              onCancel={() => setOpen(false)}
              onSubmit={(values) => {
                if (recordId)
                  create.mutate(
                    {
                      ...observationPayload(values),
                      medical_record_id: recordId,
                      name: values.name,
                      description: values.description || null,
                      medication_taken_ago:
                        values.medicationInterval == null ? null : String(values.medicationInterval),
                    },
                    {
                      onSuccess: (episode) => {
                        setOpen(false);
                        toast.success('Đã ghi nhận đợt tổn thương.');
                        router.push({
                          pathname: '/patient/lesions/[episodeId]',
                          params: { episodeId: episode.episode_id },
                        });
                      },
                    },
                  );
              }}
            />
          )}
        </ScrollView>
      </ContentModal>
    </Screen>
  );
}
