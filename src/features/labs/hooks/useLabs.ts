import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { toast } from '@/shared/ui';

import { labsApi } from '../api/labs-api';
import type { CreateLabRequestPayload } from '../types';

export function useLabResults(recordId: number | null) {
  const valid = recordId !== null && Number.isInteger(recordId) && recordId > 0;
  return useQuery({
    queryKey: ['labs', 'results', recordId],
    queryFn: ({ signal }) => labsApi.getResults(recordId!, signal),
    enabled: valid,
  });
}

export function useCreateLabRequest(recordId: number | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateLabRequestPayload) => labsApi.createRequest(payload),
    onSuccess: () => {
      toast.success('Đã lưu yêu cầu xét nghiệm.');
      return queryClient.invalidateQueries({ queryKey: ['labs', 'results', recordId] });
    },
  });
}
