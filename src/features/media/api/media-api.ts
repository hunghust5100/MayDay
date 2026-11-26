import { api, ApiError, createFormData, type UploadFile } from '@/core/api';
import { IMAGE_UPLOAD } from '@/shared/constants';
import type { AnswerImage, MediaAttachment, UploadContext } from '../types';

export function normalizeAttachment(row: MediaAttachment): MediaAttachment {
  return {
    ...row,
    id: String(row.id),
    user_id: row.user_id == null ? undefined : Number(row.user_id),
    medical_record_id: row.medical_record_id == null ? null : Number(row.medical_record_id),
    question_id: row.question_id ?? null,
  };
}
export const mediaApi = {
  list: async (userId: number, signal?: AbortSignal) =>
    (await api.get<MediaAttachment[]>(`/image-attachments/user/${userId}`, { signal })).map(
      normalizeAttachment,
    ),
  upload: async (file: UploadFile & { size?: number }, context: UploadContext = {}) => {
    if (!IMAGE_UPLOAD.mimeTypes.includes(file.mimeType)) throw new ApiError('6002');
    if (file.size != null && file.size > IMAGE_UPLOAD.maxFileSize) throw new ApiError('6003');
    const form = await createFormData({ ...context, media_type: 'image' }, { file });
    return normalizeAttachment(await api.upload<MediaAttachment>('/image-attachments/upload', form));
  },
  remove: (id: string) => api.delete(`/image-attachments/${encodeURIComponent(id)}`),
  answerImages: async (answerId: number, signal?: AbortSignal) =>
    (await api.get<AnswerImage[]>(`/answer-images/${answerId}`, { signal })).map((row) => ({
      ...row,
      id: String(row.id),
      attachment: { ...row.attachment, attachment_id: String(row.attachment.attachment_id) },
    })),
  attach: (body: { answer_id: string; attachment_id: string; option_value?: string | null }) =>
    api.post('/answer-images', body),
  detach: (id: string) => api.delete(`/answer-images/${encodeURIComponent(id)}`),
};
