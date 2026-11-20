import { api } from '@/core/api';

import type { CreateLabRequestPayload, LabRequestResponse, LabResult } from '../types';

export const labsApi = {
  createRequest: (payload: CreateLabRequestPayload) =>
    api.post<LabRequestResponse>('/lab-requests', payload),

  getResults: (recordId: number, signal?: AbortSignal) =>
    api.get<LabResult[]>(`/lab-results/${recordId}`, { signal }),
};
