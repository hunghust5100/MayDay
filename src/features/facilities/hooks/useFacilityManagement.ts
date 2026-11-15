import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { managementApi, type FacilityInput, type FacilityKind } from '../api/management-api';

export function useFacility(kind: FacilityKind, id: number) {
  return useQuery({
    queryKey: ['facilities', kind, 'detail', id],
    queryFn: ({ signal }) => managementApi.detail(kind, id, signal),
    enabled: Number.isInteger(id) && id > 0,
  });
}
export function useFacilityMutation(kind: FacilityKind, id?: number) {
  const client = useQueryClient();
  const refresh = async () => {
    await Promise.all([
      client.invalidateQueries({ queryKey: ['facilities'] }),
      client.invalidateQueries({ queryKey: ['admin', 'users'] }),
    ]);
  };
  const save = useMutation({
    mutationFn: (body: FacilityInput) => (id ? managementApi.edit(kind, id, body) : managementApi.create(kind, body)),
    onSuccess: refresh,
  });
  const remove = useMutation({
    mutationFn: () => managementApi.remove(kind, id!),
    onSuccess: async () => {
      client.removeQueries({ queryKey: ['facilities', kind, 'detail', id] });
      await refresh();
    },
  });
  return { save, remove };
}
