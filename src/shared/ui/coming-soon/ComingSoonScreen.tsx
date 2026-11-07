import { useRouter } from 'expo-router';
import { Construction } from 'lucide-react-native';

import { AppHeader } from '../app-header/AppHeader';
import { Screen } from '../screen/Screen';
import { ScreenTitle } from '../screen-title/ScreenTitle';
import { EmptyState } from '../states/EmptyState';

export type ComingSoonScreenProps = {
  title: string;
  /** Màn này sẽ làm gì — giúp người phụ trách nắm phạm vi. */
  description?: string;
  /** Thư mục feature sẽ chứa màn hình thật, VD `features/uas7`. */
  module?: string;
  /** Màn gốc của tab: tiêu đề lớn, không có nút quay lại. */
  tab?: boolean;
};

/** Màn hình giữ chỗ cho chức năng chưa làm — thay bằng màn thật trong feature tương ứng. */
export function ComingSoonScreen({ title, description, module, tab = false }: ComingSoonScreenProps) {
  const router = useRouter();
  return (
    <Screen
      header={tab ? <ScreenTitle title={title} /> : <AppHeader title={title} onBack={() => (router.canGoBack() ? router.back() : router.replace('/'))} />}>
      <EmptyState
        fill
        icon={Construction}
        title="Chức năng đang phát triển"
        description={[description, module && `Thư mục: ${module}`].filter(Boolean).join('\n')}
      />
    </Screen>
  );
}
