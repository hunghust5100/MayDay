import { api } from '@/core/api';
import type { CreatePatientRequest, Patient, PatientFilters } from '../types';
export const patientsApi = {
  search: (filters: PatientFilters & { page: number; limit: number }, signal?: AbortSignal) =>
    api.getPage<Patient>('/doctor/patients/search', { query: filters, signal }),
  create: (body: CreatePatientRequest) => api.post<Patient>('/doctor/patients/', body),
};
