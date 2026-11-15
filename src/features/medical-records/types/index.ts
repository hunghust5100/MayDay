import type { MedicalRecordStatus } from '@/shared/types';
import type { AnswerInput, FormQuestion } from '@/shared/types/clinical-form';
export type MedicalRecord = {
  medical_record_id: number;
  patient_id: number;
  assigned_doctor_id: number | null;
  created_by?: number;
  template_id: string;
  status: MedicalRecordStatus;
  instructions?: string | null;
  created_at: string;
  updated_at?: string;
  completed_at?: string | null;
  patient_name?: string;
};
export type RecordSummary = {
  medical_record_id: number;
  status: MedicalRecordStatus;
  patient_name: string;
  created_at: string;
};
export type RecordAnswer = AnswerInput & {
  id: number;
  medical_record_id: number;
  answered_by: number;
  created_at?: string;
  updated_at?: string;
};
export type RecordFilters = { status?: MedicalRecordStatus; patient_id?: number };
export type ClassificationQuestion = FormQuestion;
export type CreateRecordRequest = { patient_id?: number; template_id: string; answers: AnswerInput[] };
