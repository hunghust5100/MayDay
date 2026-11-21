import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { usePaginatedQuery } from '@/core/api';
import type { AnswerInput } from '@/features/dynamic-form';
import { recordsApi } from '../api/records-api';
import type { RecordFilters } from '../types';
export function useRecords(filters: RecordFilters, patientId?: number) {
  return usePaginatedQuery({
    queryKey: ['medical-records', 'list', patientId ?? 'all', filters],
    queryFn: ({ page, limit, signal }) =>
      patientId
        ? recordsApi.history(patientId, page, limit, filters.status, signal)
        : recordsApi.all({ ...filters, page, limit }, signal),
  });
}
export function useRecordDetail(id: number) {
  return useQuery({
    queryKey: ['medical-records', 'detail', id],
    queryFn: ({ signal }) => recordsApi.detail(id, signal),
    enabled: Number.isInteger(id) && id > 0,
  });
}
export function useRecord(id: number) {
  const enabled = Number.isInteger(id) && id > 0;
  const detail = useRecordDetail(id);
  const summary = useQuery({
    queryKey: ['medical-records', 'summary', id],
    queryFn: ({ signal }) => recordsApi.summary(id, signal),
    enabled,
  });
  const answers = useQuery({
    queryKey: ['medical-records', 'answers', id],
    queryFn: ({ signal }) => recordsApi.answers(id, signal),
    enabled,
  });
  return { detail, summary, answers };
}
export function useRecordMutations(id: number) {
  const client = useQueryClient();
  const refresh = () => client.invalidateQueries({ queryKey: ['medical-records'] });
  const accept = useMutation({
    mutationFn: () => recordsApi.accept(id),
    onSuccess: refresh,
    onError: refresh,
  });
  const save = useMutation({
    mutationFn: (answers: AnswerInput[]) => recordsApi.saveAnswers(id, answers),
    onSuccess: refresh,
  });
  const update = useMutation({
    mutationFn: (body: { status: 'completed' | 'cancelled'; instructions: string }) => recordsApi.update(id, body),
    onSuccess: refresh,
    onError: refresh,
  });
  const remove = useMutation({
    mutationFn: () => recordsApi.remove(id),
    onSuccess: async () => {
      for (const key of ['detail', 'summary', 'answers'])
        client.removeQueries({ queryKey: ['medical-records', key, id] });
      await refresh();
    },
  });
  return { accept, save, update, remove };
}
export function useCreateRecord() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: recordsApi.create,
    onSuccess: () => client.invalidateQueries({ queryKey: ['medical-records'] }),
  });
}
