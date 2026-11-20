import { apiClient } from '@/core/api/client';

export interface PrescriptionItem {
  medicine_name: string;
  dosage?: string;
  frequency?: string;
  duration?: string;
  instruction?: string;
}

export interface CreatePrescriptionPayload {
  medical_record_id: string;
  note?: string;
  items: PrescriptionItem[];
}

export const prescriptionsApi = {
  // rx01: Kê đơn
  create: (payload: CreatePrescriptionPayload) =>
    apiClient.post('/api/v1/prescriptions', payload).then(res => res.data.data),
};