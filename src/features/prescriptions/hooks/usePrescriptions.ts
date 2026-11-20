import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { toast } from '@/shared/ui';

import { prescriptionsApi } from '../api/prescriptions-api';
import type { CreatePrescriptionPayload } from '../types';

export function usePrescriptions(recordId: number | null) {
  const valid = recordId !== null && Number.isInteger(recordId) && recordId > 0;
  return useQuery({
    queryKey: ['prescriptions', 'by-record', recordId],
    queryFn: ({ signal }) => prescriptionsApi.listByRecord(recordId!, signal),
    enabled: valid,
  });
}

export function useCreatePrescription(recordId: number | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreatePrescriptionPayload) => prescriptionsApi.create(payload),
    onSuccess: () => {
      toast.success('Đã lưu đơn thuốc cho bệnh nhân.');
      void queryClient.invalidateQueries({ queryKey: ['prescriptions', 'by-record', recordId] });
    },
  });
}
