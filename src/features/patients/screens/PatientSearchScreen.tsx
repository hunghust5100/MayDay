import { useRouter } from 'expo-router';
import { useQueryClient } from '@tanstack/react-query';
import { canCreatePatient, useSession } from '@/core/auth';
import { useState } from 'react';
import { View } from 'react-native';
import { GENDER_OPTIONS } from '@/shared/constants';
import { NumberField, SearchBar, SelectField } from '@/shared/form';
import { BottomSheet, Button, ListItem, PaginatedList, Screen, ScreenTitle, Text } from '@/shared/ui';
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
  return (
    <Screen scroll={false} header={<ScreenTitle title="Bệnh nhân" eyebrow={`${query.total} kết quả`} />}>
      <View className="gap-3 pb-3">
        <SearchBar value={search} onChange={setSearch} onSearch={setKeyword} placeholder="Tên hoặc số điện thoại" />
        <View className="flex-row gap-3">
          <Button title="Bộ lọc" variant="soft" onPress={() => setOpen(true)} />
          {user && canCreatePatient(user.role_id) && (
            <Button title="Thêm bệnh nhân" onPress={() => router.push('/doctor/patients/new')} />
          )}
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
      <BottomSheet visible={open} onClose={() => setOpen(false)} title="Lọc bệnh nhân">
        <View className="gap-4">
          <SelectField
            label="Giới tính"
            value={gender}
            onChange={setGender}
            options={[{ value: '', label: 'Tất cả' }, ...GENDER_OPTIONS]}
          />
          <NumberField label="Năm sinh từ" value={min} onChange={setMin} maxLength={4} />
          <NumberField
            label="Đến năm"
            value={max}
            onChange={setMax}
            maxLength={4}
            hint="Chỉ nhập một năm để tìm chính xác năm đó"
          />
          {error ? <Text tone="danger">{error}</Text> : null}
          <Button
            title="Áp dụng"
            onPress={() => {
              const parsed = patientFilterSchema.safeParse({ min_year: min, max_year: max });
              if (!parsed.success) {
                setError(parsed.error.issues[0].message);
                return;
              }
              setError('');
              setFilters({
                gender: gender ? (gender as PatientFilters['gender']) : undefined,
                min_year: min ?? undefined,
                max_year: max ?? undefined,
              });
              setOpen(false);
            }}
          />
          <Button
            title="Xóa bộ lọc"
            variant="ghost"
            onPress={() => {
              setMin(null);
              setMax(null);
              setGender('');
              setError('');
              setFilters({});
              setOpen(false);
            }}
          />
        </View>
      </BottomSheet>
    </Screen>
  );
}
