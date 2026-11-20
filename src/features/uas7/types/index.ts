export interface Uas7Eligibility {
  eligible: string; // "true" hoặc "false"
  medical_record_id?: string;
}

export interface Uas7Score {
  patient_id: string;
  medical_record_id: string;
  score_date: string;
  iss7: string;
  hss7: string;
  daily_score: string;
  note?: string;
  created_at: string;
  updated_at: string;
}

export interface CreateUas7Payload {
  medical_record_id: string;
  score_date: string; // YYYY-MM-DD
  iss7: string;       // 0-3
  hss7: string;       // 0-3
  note?: string;
}