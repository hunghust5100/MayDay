import { useMutation, useQueryClient } from '@tanstack/react-query';
import { usePaginatedQuery } from '@/core/api';
import { patientsApi } from '../api/patients-api';
import type { PatientFilters } from '../types';
export function usePatients(filters: PatientFilters, enabled = true) {
  return usePaginatedQuery({
    queryKey: ['patients', 'search', filters],
    enabled,
    queryFn: ({ page, limit, signal }) => patientsApi.search({ ...filters, page, limit }, signal),
  });
}
export function useCreatePatient() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: patientsApi.create,
    meta: { silent: true },
    onSuccess: async (patient) => {
      client.setQueryData(['patients', 'selected', patient.user_id], patient);
      await Promise.all([
        client.invalidateQueries({ queryKey: ['patients', 'search'] }),
        client.invalidateQueries({ queryKey: ['admin', 'users'] }),
      ]);
    },
  });
}
