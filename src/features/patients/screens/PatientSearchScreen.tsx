import { useRouter } from 'expo-router';
import { SlidersHorizontal, UserPlus } from 'lucide-react-native';
import { useQueryClient } from '@tanstack/react-query';
import { canCreatePatient, useSession } from '@/core/auth';
import { useState } from 'react';
import { ScrollView, View } from 'react-native';
import { GENDER_OPTIONS } from '@/shared/constants';
import { NumberField, SearchBar } from '@/shared/form';
import { BottomSheet, Button, IconButton, ListItem, PaginatedList, Screen, ScreenTitle, SegmentedControl, Text } from '@/shared/ui';
import { usePatients } from '../hooks/usePatients';
import { patientFilterSchema } from '../schemas';
import type { PatientFilters } from '../types';

export function PatientSearchScreen() {
  const router = useRouter();
  const client = useQueryClient();
  const { user } = useSession();
  const [search, setSearch] = useState('');
  const [keyword, setKeyword] = useState('');
  const [filters, setFilters] = useState<PatientFilters>({});
  const [open, setOpen] = useState(false);
  const [gender, setGender] = useState('');
  const [min, setMin] = useState<number | null>(null);
  const [max, setMax] = useState<number | null>(null);
  const [error, setError] = useState('');
  const query = usePatients({ ...filters, keyword: keyword || undefined });
  const activeFilters = Number(Boolean(filters.gender)) + Number(filters.min_year != null || filters.max_year != null);
  const openFilters = () => {
    setGender(filters.gender ?? '');
    setMin(filters.min_year ?? null);
    setMax(filters.max_year ?? null);
    setError('');
    setOpen(true);
  };
  const applyFilters = () => {
    const parsed = patientFilterSchema.safeParse({ min_year: min, max_year: max });
    if (!parsed.success) {
      setError(parsed.error.issues[0].message);
      return;
    }
    setFilters({
      gender: gender ? (gender as PatientFilters['gender']) : undefined,
      min_year: min ?? undefined,
      max_year: max ?? undefined,
    });
    setOpen(false);
  };
  return (
    <Screen scroll={false} header={
      <ScreenTitle title="Bệnh nhân" right={user && canCreatePatient(user.role_id) && (
        <IconButton icon={UserPlus} variant="soft" accessibilityLabel="Thêm bệnh nhân" onPress={() => router.push('/doctor/patients/new')} />
      )} />
    }>
      <View className="gap-2 pb-2">
        <SearchBar
          value={search}
          onChange={setSearch}
          onSearch={setKeyword}
          placeholder="Tên hoặc số điện thoại"
        />
        <View className="flex-row flex-wrap items-center justify-between gap-2">
          <Button title={activeFilters ? `Bộ lọc (${activeFilters})` : 'Bộ lọc'} size="sm" leftIcon={SlidersHorizontal} variant="soft" onPress={openFilters} />
          {query.data && <Text variant="caption" tone="muted" accessibilityLiveRegion="polite">{query.total} bệnh nhân</Text>}
        </View>
      </View>
      <PaginatedList
        {...query.listProps}
        padded={false}
        keyExtractor={(p) => String(p.user_id)}
        emptyTitle="Không tìm thấy bệnh nhân"
        renderItem={({ item }) => (
          <ListItem
            title={item.full_name}
            description={`${item.phone} · ${item.year_of_birth ?? 'Chưa rõ năm sinh'}`}
            onPress={() => {
              client.setQueryData(['patients', 'selected', item.user_id], item);
              router.push(`/doctor/patients/${item.user_id}`);
            }}
          />
        )}
      />
      <BottomSheet
        visible={open}
        onClose={() => setOpen(false)}
        title="Lọc bệnh nhân"
        fixedHeight
        footer={(
          <View className="flex-row items-stretch gap-2">
            <Button title="Xóa bộ lọc" size="sm" variant="ghost" className="min-w-0 flex-1 self-stretch" onPress={() => {
              setFilters({});
              setOpen(false);
            }} />
            <Button title="Áp dụng" size="sm" className="min-w-0 flex-1 self-stretch" onPress={applyFilters} />
          </View>
        )}>
        <ScrollView
          className="min-h-0 flex-1"
          keyboardShouldPersistTaps="handled"
          contentContainerClassName="gap-3 pb-2"
        >
          <Text variant="label">Giới tính</Text>
          <SegmentedControl
            wrap
            value={gender}
            onChange={setGender}
            options={[{ value: '', label: 'Tất cả' }, ...GENDER_OPTIONS]}
          />
          <NumberField label="Năm sinh từ" value={min} onChange={(value) => { setMin(value); setError(''); }} maxLength={4} />
          <NumberField
            label="Đến năm"
            value={max}
            onChange={(value) => { setMax(value); setError(''); }}
            maxLength={4}
            hint="Nhập một năm để tìm đúng năm đó."
          />
          {error ? <Text tone="danger" accessibilityRole="alert">{error}</Text> : null}
        </ScrollView>
      </BottomSheet>
    </Screen>
  );
}
