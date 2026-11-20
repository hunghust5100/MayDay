export type PrescriptionItem = {
  id?: number;
  medicine_name: string;
  dosage?: string | null;
  frequency?: string | null;
  duration?: string | null;
  instruction?: string | null;
};

export type Prescription = {
  id: number;
  medical_record_id: number;
  doctor_id?: number;
  doctor_name?: string | null;
  note?: string | null;
  items: PrescriptionItem[];
  created_at: string;
  updated_at?: string;
};

export type CreatePrescriptionPayload = {
  medical_record_id: number;
  note?: string;
  items: {
    medicine_name: string;
    dosage?: string;
    frequency?: string;
    duration?: string;
    instruction?: string;
  }[];
};
