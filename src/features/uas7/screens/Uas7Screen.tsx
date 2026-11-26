import { useRouter } from 'expo-router';
import { Activity, CheckCircle2 } from 'lucide-react-native';
import { useMemo } from 'react';
import { View } from 'react-native';

import { useSession } from '@/core/auth';
import { getSeverityColor } from '@/shared/constants';
import { FormField, ScoreScale, TextField, useZodForm, type ScoreLevel } from '@/shared/form';
import type { Tone } from '@/shared/types';
import {
  AppHeader,
  Badge,
  Button,
  Card,
  Divider,
  EmptyState,
  ErrorState,
  Icon,
  ScoreBarChart,
  Screen,
  SectionHeader,
  Spinner,
  StatCard,
  Text,
  type ScoreBar,
} from '@/shared/ui';
import { addDays, formatDate, parseApiDate, toApiDate, weekdayShort } from '@/shared/utils';

import { useCreateUas7Score, useUas7Eligibility, useUas7History } from '../hooks/useUas7';
import { uas7Schema, type Uas7FormValues } from '../schemas';

const ISS7_LEVELS: readonly ScoreLevel[] = [
  { value: 0, label: 'Không' },
  { value: 1, label: 'Nhẹ' },
  { value: 2, label: 'Trung bình' },
  { value: 3, label: 'Nặng' },
];

const HSS7_LEVELS: readonly ScoreLevel[] = [
  { value: 0, label: 'Không', description: '0 nốt' },
  { value: 1, label: 'Nhẹ', description: '< 20 nốt' },
  { value: 2, label: 'Trung bình', description: '20–50 nốt' },
  { value: 3, label: 'Nặng', description: '> 50 nốt' },
];

function weeklySeverity(total: number): { label: string; tone: Tone } {
  if (total === 0) return { label: 'Không có triệu chứng', tone: 'success' };
  if (total <= 6) return { label: 'Kiểm soát tốt', tone: 'success' };
  if (total <= 15) return { label: 'Nhẹ', tone: 'info' };
  if (total <= 27) return { label: 'Trung bình', tone: 'warning' };
  return { label: 'Nặng', tone: 'danger' };
}

function dailyTone(score: number): Tone {
  if (score <= 1) return 'success';
  if (score <= 3) return 'info';
  if (score <= 4) return 'warning';
  return 'danger';
}

/** Bệnh nhân — chấm điểm UAS7 hằng ngày và theo dõi biểu đồ 7 ngày. */
export function Uas7Screen() {
  const router = useRouter();
  const auth = useSession();
  const patientId = auth.status === 'signedIn' ? auth.user.user_id : undefined;

  const eligibility = useUas7Eligibility(Boolean(patientId));
  const history = useUas7History(patientId);
  const submitMutation = useCreateUas7Score();

  const todayKey = toApiDate(new Date());

  const form = useZodForm(uas7Schema, {
    defaultValues: { note: '' },
  });

  const sortedHistory = useMemo(
    () => [...(history.data ?? [])].sort((a, b) => b.score_date.localeCompare(a.score_date)),
    [history.data],
  );

  const todayScore = useMemo(
    () => sortedHistory.find((item) => item.score_date === todayKey),
    [sortedHistory, todayKey],
  );

  const { chartBars, weeklyTotal, recordedDays } = useMemo(() => {
    const byDate = new Map(sortedHistory.map((item) => [item.score_date, item]));
    const today = parseApiDate(todayKey) ?? new Date();
    const bars: ScoreBar[] = [];
    let total = 0;
    let days = 0;
    for (let offset = -6; offset <= 0; offset++) {
      const date = addDays(today, offset);
      const key = toApiDate(date);
      const found = byDate.get(key);
      if (found) {
        total += found.daily_score;
        days++;
      }
      bars.push({
        label: weekdayShort(date),
        value: found ? found.daily_score : null,
        highlight: offset === 0,
      });
    }
    return { chartBars: bars, weeklyTotal: total, recordedDays: days };
  }, [sortedHistory, todayKey]);

  const onBack = () => (router.canGoBack() ? router.back() : router.replace('/'));

  if (eligibility.isLoading) {
    return (
      <Screen header={<AppHeader title="Thang điểm UAS7" onBack={onBack} />} scroll={false}>
        <Spinner />
      </Screen>
    );
  }

  if (eligibility.isError) {
    return (
      <Screen header={<AppHeader title="Thang điểm UAS7" onBack={onBack} />} scroll={false}>
        <ErrorState
          fill
          onRetry={() => {
            void eligibility.refetch();
            void history.refetch();
          }}
        />
      </Screen>
    );
  }

  const onSubmit = form.handleSubmit((values: Uas7FormValues) => {
    const recordId = eligibility.data?.medical_record_id;
    if (!recordId) return;
    submitMutation.mutate(
      {
        medical_record_id: recordId,
        score_date: todayKey,
        iss7: values.iss7,
        hss7: values.hss7,
        note: values.note?.trim() || undefined,
      },
      {
        onSuccess: () => {
          form.reset();
        },
      },
    );
  });

  const weekBadge = weeklySeverity(weeklyTotal);

  return (
    <Screen header={<AppHeader title="Thang điểm UAS7" onBack={onBack} />}>
      <View className="gap-3 roomy:gap-4">
        {history.isLoading ? (
          <Spinner />
        ) : history.isError ? (
          <ErrorState title="Chưa tải được điểm hôm nay" onRetry={() => void history.refetch()} />
        ) : todayScore ? (
          <Card padding="lg" className="gap-2 border-success/30 bg-success-soft">
            <View className="flex-row flex-wrap items-center justify-between gap-2">
              <View className="flex-row items-center gap-2">
                <Icon as={CheckCircle2} size={20} color="success" />
                <Text variant="h3" tone="success">
                  Đã chấm điểm hôm nay
                </Text>
              </View>
              <Badge label={`${todayScore.daily_score}/6 điểm`} tone={dailyTone(todayScore.daily_score)} />
            </View>
            <Text variant="caption" tone="success">
              Ngứa (ISS7): {todayScore.iss7} · Sẩn phù (HSS7): {todayScore.hss7}
            </Text>
            {todayScore.note && (
              <Text variant="caption" tone="muted">
                Ghi chú: {todayScore.note}
              </Text>
            )}
          </Card>
        ) : eligibility.data?.eligible ? (
          <Card padding="lg" className="gap-3 roomy:gap-4">
            <View className="gap-1">
              <Text variant="h2">Chấm điểm hôm nay</Text>
              <Text variant="caption" tone="muted">
                Ngày {formatDate(todayKey)} · Bệnh án #{eligibility.data.medical_record_id}
              </Text>
            </View>

            <FormField
              control={form.control}
              name="iss7"
              render={(field) => (
                <ScoreScale
                  label="Mức độ ngứa (ISS7)"
                  required
                  levels={ISS7_LEVELS}
                  value={field.value}
                  onChange={field.onChange}
                  error={field.error}
                />
              )}
            />

            <FormField
              control={form.control}
              name="hss7"
              render={(field) => (
                <ScoreScale
                  label="Số lượng nốt sẩn phù (HSS7)"
                  required
                  levels={HSS7_LEVELS}
                  value={field.value}
                  onChange={field.onChange}
                  error={field.error}
                />
              )}
            />

            <FormField
              control={form.control}
              name="note"
              render={(field) => (
                <TextField
                  label="Ghi chú"
                  placeholder="Triệu chứng nổi bật, yếu tố kích phát (nếu có)..."
                  multiline
                  value={field.value}
                  onChange={field.onChange}
                  onBlur={field.onBlur}
                  error={field.error}
                />
              )}
            />

            <Button
              title={submitMutation.isPending ? 'Đang gửi...' : 'Gửi kết quả hôm nay'}
              fullWidth
              loading={submitMutation.isPending}
              onPress={() => void onSubmit()}
            />
          </Card>
        ) : (
          <Card padding="lg" className="border-warning/40 bg-warning-soft">
            <Text weight="semibold" tone="warning">
              Chưa đủ điều kiện chấm điểm UAS7
            </Text>
            <Text variant="caption" tone="muted" className="mt-1">
              Bạn cần có bệnh án mề đay mạn tính đang chờ tiếp nhận hoặc đang điều trị để ghi nhận điểm hằng
              ngày.
            </Text>
          </Card>
        )}

        <StatCard
          label={
            recordedDays === 7 ? 'Tổng điểm UAS7 (7 ngày gần nhất)' : 'Điểm đã ghi trong 7 ngày gần nhất'
          }
          value={recordedDays ? weeklyTotal : '—'}
          unit={recordedDays === 7 ? '/ 42' : undefined}
          icon={Activity}
          tone="teal"
          footer={
            recordedDays === 7 ? (
              <Badge label={weekBadge.label} tone={weekBadge.tone} />
            ) : (
              <Badge label={`Đã ghi ${recordedDays}/7 ngày`} tone="neutral" />
            )
          }
        />

        <Card padding="lg" className="gap-3">
          <SectionHeader title="Biểu đồ 7 ngày gần nhất" />
          <ScoreBarChart data={chartBars} max={6} colorFor={(value) => getSeverityColor(value, 6)} />
        </Card>

        <Card padding="lg" className="gap-3">
          <SectionHeader title="Lịch sử chấm điểm" />
          {history.isLoading ? (
            <Spinner />
          ) : history.isError ? (
            <ErrorState onRetry={() => void history.refetch()} />
          ) : sortedHistory.length === 0 ? (
            <EmptyState
              icon={Activity}
              title="Chưa có dữ liệu UAS7"
              description="Các lần chấm điểm hằng ngày sẽ được lưu và hiển thị tại đây."
            />
          ) : (
            <View className="gap-3">
              {sortedHistory.map((item, idx) => (
                <View key={item.id}>
                  {idx > 0 && <Divider className="mb-3" />}
                  <View className="flex-row items-center justify-between gap-2">
                    <View className="flex-1 gap-0.5">
                      <Text weight="semibold">{formatDate(item.score_date)}</Text>
                      <Text variant="caption" tone="muted">
                        Ngứa (ISS7): {item.iss7} · Sẩn phù (HSS7): {item.hss7}
                      </Text>
                      {item.note && (
                        <Text variant="caption" tone="muted">
                          {item.note}
                        </Text>
                      )}
                    </View>
                    <Badge label={`${item.daily_score}/6`} tone={dailyTone(item.daily_score)} />
                  </View>
                </View>
              ))}
            </View>
          )}
        </Card>
      </View>
    </Screen>
  );
}
