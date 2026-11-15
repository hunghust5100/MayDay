import { api } from '@/core/api';
import type { AnswerInput } from '@/features/dynamic-form';
import type {
  ClassificationQuestion,
  CreateRecordRequest,
  MedicalRecord,
  RecordAnswer,
  RecordFilters,
  RecordSummary,
} from '../types';
export const recordsApi = {
  classifyQuestions: (signal?: AbortSignal) =>
    api.get<ClassificationQuestion[]>('/medical_records/classify-questions', { signal }),
  classify: (answers: { question_id: string; option_value: string }[]) =>
    api.post<{ template_id: string; template_name: string }>('/medical_records/classify', { answers }),
  create: (body: CreateRecordRequest) => api.post<MedicalRecord>('/medical_records/', body),
  all: (filters: RecordFilters & { page: number; limit: number }, signal?: AbortSignal) =>
    api.getPage<MedicalRecord>('/medical_records/all', { query: filters, signal }),
  history: (id: number, page: number, limit: number, status: RecordFilters['status'], signal?: AbortSignal) =>
    api.getPage<MedicalRecord>(`/medical_records/patients/${id}/history`, { query: { page, limit, status }, signal }),
  detail: (id: number, signal?: AbortSignal) => api.get<MedicalRecord>(`/medical_records/${id}`, { signal }),
  summary: (id: number, signal?: AbortSignal) => api.get<RecordSummary>(`/medical_records/${id}/summary`, { signal }),
  answers: (id: number, signal?: AbortSignal) => api.get<RecordAnswer[]>(`/medical_records/${id}/answers`, { signal }),
  accept: (id: number) => api.post<MedicalRecord>(`/medical_records/${id}/accept`),
  update: (id: number, body: { status: 'completed' | 'cancelled'; instructions: string }) =>
    api.put<MedicalRecord>(`/medical_records/${id}`, body),
  saveAnswers: (id: number, answers: AnswerInput[]) =>
    api.put<{ count: number }>(`/medical_records/${id}/answers`, { answers }),
  remove: (id: number) => api.delete(`/medical_records/${id}/`),
};
