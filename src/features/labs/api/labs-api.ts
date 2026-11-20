import { api } from '@/core/api/client';

export interface LabRequestItem {
  test_name: string;
  description?: string;
}

export interface CreateLabRequestPayload {
  medical_record_id: string;
  note?: string;
  items: LabRequestItem[];
}

export const labsApi = {
  createRequest: (payload: CreateLabRequestPayload) =>
    api.post<any>('/api/v1/lab-requests', payload),
    
  getResults: (recordId: string) =>
    api.get<any[]>(`/api/v1/lab-results/${recordId}`),
};