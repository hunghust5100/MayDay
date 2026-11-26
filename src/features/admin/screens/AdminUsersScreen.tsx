import { useRouter } from 'expo-router';
import { BriefcaseMedical, UserPlus, UsersRound } from 'lucide-react-native';
import { useState } from 'react';
import { View } from 'react-native';

import { SearchBar } from '@/shared/form';
import {
  BottomSheet,
  Icon,
  IconButton,
  ListItem,
  PaginatedList,
  Screen,
  ScreenTitle,
  SegmentedControl,
} from '@/shared/ui';

import { UserCard } from '../components/UserCard';
import { roleTitle, useRoleLabel, useRoles } from '../hooks/useRbac';
import { useUsers } from '../hooks/useUsers';
import type { UserFilters } from '../types';

/** Bộ lọc gộp: tất cả / đã khóa / theo từng vai trò (`role:<id>`). */
type FilterValue = 'all' | 'locked' | `role:${number}`;

function toFilters(filter: FilterValue, keyword: string): UserFilters {
  return {
    keyword: keyword || undefined,
    is_active: filter === 'locked' ? 0 : undefined,
    role_id: filter.startsWith('role:') ? Number(filter.slice(5)) : undefined,
  };
}

/** admin02 — Tab "Người dùng": tìm kiếm, lọc, phân trang. */
export function AdminUsersScreen() {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [keyword, setKeyword] = useState('');
  const [filter, setFilter] = useState<FilterValue>('all');
  const [adding, setAdding] = useState(false);
  const { data: roles = [] } = useRoles();
  const roleLabel = useRoleLabel();
  const { listProps, total, isSuccess } = useUsers(toFilters(filter, keyword));

  const filterOptions = [
    { value: 'all' as const, label: 'Tất cả' },
    { value: 'locked' as const, label: 'Đã khóa' },
    ...roles.map((role) => ({ value: `role:${role.id}` as const, label: roleTitle(role) })),
  ];

  const go = (href: '/admin/users/new' | '/admin/users/new-staff') => {
    setAdding(false);
    router.push(href);
  };

  return (
    <Screen
      scroll={false}
      header={
        <ScreenTitle
          title="Người dùng"
          eyebrow={isSuccess ? `${total} tài khoản` : 'Quản trị tài khoản'}
          right={<IconButton icon={UserPlus} variant="soft" accessibilityLabel="Thêm người dùng" onPress={() => setAdding(true)} />}
        />
      }>
      <View className="gap-3 pb-3">
        <SearchBar value={search} onChange={setSearch} onSearch={setKeyword} placeholder="Tìm theo tên, số điện thoại…" />
        <SegmentedControl options={filterOptions} value={filter} onChange={setFilter} />
      </View>
      <PaginatedList
        {...listProps}
        padded={false}
        keyExtractor={(user) => String(user.user_id)}
        renderItem={({ item }) => (
          <UserCard user={item} roleLabel={roleLabel(item.role_id)} onPress={() => router.push(`/admin/users/${item.user_id}`)} />
        )}
        emptyIcon={UsersRound}
        emptyTitle="Không có người dùng"
        emptyDescription={keyword || filter !== 'all' ? 'Thử đổi từ khóa hoặc bộ lọc.' : undefined}
      />

      <BottomSheet visible={adding} onClose={() => setAdding(false)} title="Thêm tài khoản">
        <View className="pb-2">
          <ListItem
            title="Thêm người dùng"
            description="Tạo tài khoản và chọn vai trò"
            leading={
              <View className="h-11 w-11 items-center justify-center rounded-full bg-primary-soft">
                <Icon as={UserPlus} size={22} color="primary-strong" />
              </View>
            }
            onPress={() => go('/admin/users/new')}
          />
          <ListItem
            title="Thêm nhân viên y tế"
            description="Tạo tài khoản kèm nơi công tác"
            leading={
              <View className="h-11 w-11 items-center justify-center rounded-full bg-info-soft">
                <Icon as={BriefcaseMedical} size={22} color="info" />
              </View>
            }
            onPress={() => go('/admin/users/new-staff')}
          />
        </View>
      </BottomSheet>
    </Screen>
  );
}
