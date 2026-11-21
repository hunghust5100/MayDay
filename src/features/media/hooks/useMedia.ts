import { useMutation, useQueries, useQuery, useQueryClient } from '@tanstack/react-query';
import type { UploadFile } from '@/core/api';
import type { ImageSelections } from '@/shared/types/clinical-form';
import { mediaApi } from '../api/media-api';
import type { UploadContext } from '../types';

export function useMedia(userId?: number) {
  return useQuery({
    queryKey: ['media', 'library', userId],
    queryFn: ({ signal }) => mediaApi.list(userId!, signal),
    enabled: userId != null,
  });
}
export function useUploadMedia() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({ file, context }: { file: UploadFile & { size?: number }; context?: UploadContext }) =>
      mediaApi.upload(file, context),
    onSuccess: () => client.invalidateQueries({ queryKey: ['media', 'library'] }),
  });
}
export function useDeleteMedia() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: mediaApi.remove,
    onSuccess: async () => {
      await Promise.all([
        client.invalidateQueries({ queryKey: ['media'] }),
        client.invalidateQueries({ queryKey: ['lesions'] }),
      ]);
    },
  });
}
export function useRecordImages(answers: { id: number; question_id: string }[]) {
  const queries = useQueries({
    queries: answers.map((answer) => ({
      queryKey: ['media', 'answer', answer.id],
      queryFn: ({ signal }: { signal: AbortSignal }) => mediaApi.answerImages(answer.id, signal),
    })),
  });
  const images: ImageSelections = {};
  queries.forEach((query, index) => {
    images[answers[index].question_id] = (query.data ?? []).map((row) => ({
      attachment_id: row.attachment.attachment_id,
      file_url: row.attachment.file_url,
      file_name: row.attachment.file_name,
      option_value: row.option_value ?? null,
    }));
  });
  return {
    images,
    isLoading: queries.some((q) => q.isLoading),
    isError: queries.some((q) => q.isError),
    refetch: () => Promise.all(queries.map((q) => q.refetch())),
  };
}
export { syncAnswerImages } from '../api/answer-images';
