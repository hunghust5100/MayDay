import { useRouter } from 'expo-router';
import { Activity, ChevronRight, Images, ScanFace, type LucideIcon } from 'lucide-react-native';
import { View } from 'react-native';

import { Card, Icon, IconTile, Screen, ScreenTitle, Text, type IconTileTone } from '@/shared/ui';

function TrackingCard({
  icon,
  tone,
  title,
  description,
  onPress,
}: {
  icon: LucideIcon;
  tone: IconTileTone;
  title: string;
  description?: string;
  onPress: () => void;
}) {
  return (
    <Card onPress={onPress} padding="lg" className="flex-row items-center gap-4">
      <IconTile icon={icon} tone={tone} />
      <View className="flex-1 gap-1">
        <Text variant="h3">{title}</Text>
        {description && <Text variant="caption" tone="muted">{description}</Text>}
      </View>
      <Icon as={ChevronRight} size={20} color="subtle" />
    </Card>
  );
}

/** Tab "Theo dõi" của bệnh nhân — lối vào UAS7, tổn thương da, kho ảnh. */
export function PatientTrackingScreen() {
  const router = useRouter();
  return (
    <Screen header={<ScreenTitle title="Theo dõi" eyebrow="Mề đay & tổn thương da" />}>
      <View className="gap-3">
        <TrackingCard
          icon={Activity}
          tone="teal"
          title="Chấm điểm UAS7"
          description="Ghi điểm hằng ngày"
          onPress={() => router.push('/patient/uas7')}
        />
        <TrackingCard
          icon={ScanFace}
          tone="rose"
          title="Theo dõi tổn thương da"
          description="Ghi đợt, vị trí và ảnh"
          onPress={() => router.push('/patient/lesions')}
        />
        <TrackingCard
          icon={Images}
          tone="indigo"
          title="Kho ảnh"
          onPress={() => router.push('/patient/media')}
        />
      </View>
    </Screen>
  );
}
