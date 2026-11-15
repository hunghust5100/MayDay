import { useRouter } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';
import { SelectField } from '@/shared/form';
import { Button, EmptyState, ErrorState, ListItem, Screen, ScreenTitle, SegmentedControl, Spinner } from '@/shared/ui';
import { facilityLabels, type FacilityKind } from '../api/management-api';
import { useBranches, useDepartments, useRooms } from '../hooks/useFacilities';

export function FacilitiesScreen() {
  const router = useRouter();
  const [kind, setKind] = useState<FacilityKind>('branches');
  const [branch, setBranch] = useState(0);
  const [department, setDepartment] = useState(0);
  const branches = useBranches();
  const departments = useDepartments(branch || undefined);
  const rooms = useRooms(department > 0 ? department : undefined);
  const query = kind === 'branches' ? branches : kind === 'departments' ? departments : rooms;
  const rows =
    kind === 'branches'
      ? branches.data
      : kind === 'departments'
        ? departments.data
        : rooms.data?.filter((r) =>
            department === -1
              ? r.department_id === null
              : !branch || departments.data?.some((d) => d.id === r.department_id),
          );
  return (
    <Screen header={<ScreenTitle title="Cơ sở" eyebrow="Chi nhánh · Khoa · Phòng khám" />}>
      <View className="gap-4">
        <SegmentedControl
          options={(Object.keys(facilityLabels) as FacilityKind[]).map((value) => ({
            value,
            label: facilityLabels[value],
          }))}
          value={kind}
          onChange={setKind}
        />
        {kind !== 'branches' && (
          <SelectField
            label="Chi nhánh"
            value={branch}
            onChange={(v) => {
              setBranch(v);
              setDepartment(0);
            }}
            options={[
              { value: 0, label: 'Tất cả chi nhánh' },
              ...(branches.data ?? []).map((b) => ({ value: b.id, label: b.name })),
            ]}
          />
        )}
        {kind === 'rooms' && (
          <SelectField
            label="Khoa"
            value={department}
            onChange={setDepartment}
            options={[
              { value: 0, label: 'Tất cả khoa' },
              { value: -1, label: 'Phòng chưa thuộc khoa' },
              ...(departments.data ?? []).map((d) => ({ value: d.id, label: d.name })),
            ]}
          />
        )}
        <Button
          title={`Thêm ${facilityLabels[kind].toLowerCase()}`}
          onPress={() => router.push(`/admin/facilities/${kind}/new`)}
        />
        {query.isLoading ? (
          <Spinner />
        ) : query.isError ? (
          <ErrorState onRetry={() => query.refetch()} />
        ) : !rows?.length ? (
          <EmptyState title="Chưa có dữ liệu" />
        ) : (
          rows.map((row) => (
            <ListItem
              key={row.id}
              title={row.name}
              description={
                'address' in row
                  ? row.address
                  : 'department_id' in row && row.department_id === null
                    ? 'Chưa thuộc khoa'
                    : (row.description ?? undefined)
              }
              onPress={() => router.push(`/admin/facilities/${kind}/${row.id}`)}
            />
          ))
        )}
      </View>
    </Screen>
  );
}
