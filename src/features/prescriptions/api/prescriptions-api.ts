import { api } from '@/core/api';

import type { CreatePrescriptionPayload, Prescription } from '../types';

export const prescriptionsApi = {
  listByRecord: (recordId: number, signal?: AbortSignal) =>
    api.get<Prescription[]>(`/prescriptions/${recordId}`, { signal }),

  create: (payload: CreatePrescriptionPayload) => api.post<Prescription>('/prescriptions', payload),
};
