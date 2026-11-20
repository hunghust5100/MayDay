export type Uas7Eligibility = {
  eligible: boolean;
  medical_record_id: number | null;
};

export type Uas7Score = {
  id: number;
  patient_id: number;
  medical_record_id: number;
  score_date: string;
  iss7: number;
  hss7: number;
  daily_score: number;
  note: string | null;
  created_at: string;
  updated_at: string;
};

export type CreateUas7Payload = {
  medical_record_id: number;
  score_date: string; // YYYY-MM-DD
  iss7: number; // 0-3 (điểm ngứa)
  hss7: number; // 0-3 (điểm nốt sẩn phù)
  note?: string;
};
