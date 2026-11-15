import { useQuery } from '@tanstack/react-query';
import { api } from '@/core/api';
import type { ClinicalTemplate } from '@/shared/types/clinical-form';
export function useTemplate(id?: string) {
  return useQuery({
    queryKey: ['templates', 'detail', id],
    queryFn: ({ signal }) => api.get<ClinicalTemplate>(`/templates/${encodeURIComponent(id!)}`, { signal }),
    enabled: Boolean(id),
  });
}
