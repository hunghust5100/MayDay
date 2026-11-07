import { ChevronRight } from 'lucide-react-native';
import { View } from 'react-native';

import { Avatar, Badge, Card, Icon, Text } from '@/shared/ui';
import { formatPhone } from '@/shared/utils';

import type { UserListItem } from '../types';

export function UserCard({ user, roleLabel, onPress }: { user: UserListItem; roleLabel: string; onPress: () => void }) {
  const locked = user.is_active !== 1;
  return (
    <Card onPress={onPress} className="flex-row items-center gap-3">
      <Avatar name={user.full_name} />
      <View className="flex-1 gap-0.5">
        <View className="flex-row items-center gap-2">
          <Text weight="semibold" numberOfLines={1} className="shrink">
            {user.full_name}
          </Text>
          {locked && <Badge label="Đã khóa" tone="danger" />}
        </View>
        <Text variant="caption" tone="muted" numberOfLines={1}>
          {formatPhone(user.phone)} · {roleLabel}
        </Text>
      </View>
      <Icon as={ChevronRight} size={20} color="subtle" />
    </Card>
  );
}
