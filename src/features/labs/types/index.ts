export type LabRequestItem = {
  test_name: string;
  description?: string;
};

export type CreateLabRequestPayload = {
  medical_record_id: number;
  note?: string;
  items: LabRequestItem[];
};

export type LabResultStatus = 'pending' | 'completed';

export type LabResult = {
  id: number;
  lab_request_id?: number;
  medical_record_id: number;
  test_name: string;
  description?: string | null;
  note?: string | null;
  result_value?: string | null;
  reference_range?: string | null;
  status?: LabResultStatus;
  created_at: string;
  updated_at?: string;
};

export type LabRequestResponse = {
  id: number;
  medical_record_id: number;
  note?: string | null;
  items: LabResult[];
  created_at: string;
};
