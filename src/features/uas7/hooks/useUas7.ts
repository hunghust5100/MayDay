import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { toast } from '@/shared/ui';

import { uas7Api } from '../api/uas7-api';
import type { CreateUas7Payload } from '../types';

export function useUas7Eligibility(enabled = true) {
  return useQuery({
    queryKey: ['uas7', 'eligibility'],
    queryFn: ({ signal }) => uas7Api.checkEligibility(signal),
    enabled,
  });
}

export function useUas7History(patientId?: number) {
  return useQuery({
    queryKey: ['uas7', 'history', patientId],
    queryFn: ({ signal }) => uas7Api.getHistory(patientId!, signal),
    enabled: Number.isInteger(patientId) && (patientId ?? 0) > 0,
  });
}

export function useCreateUas7Score() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateUas7Payload) => uas7Api.createScore(payload),
    onSuccess: () => {
      toast.success('Đã ghi nhận điểm UAS7 hôm nay.');
      return queryClient.invalidateQueries({ queryKey: ['uas7'] });
    },
  });
}
