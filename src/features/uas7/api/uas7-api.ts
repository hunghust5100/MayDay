import { api } from '@/core/api';

import type { CreateUas7Payload, Uas7Eligibility, Uas7Score } from '../types';

type RawEligibility = {
  eligible: boolean | string;
  medical_record_id?: number | string | null;
};

type RawUas7Score = {
  id?: number | string;
  patient_id: number | string;
  medical_record_id: number | string;
  score_date: string;
  iss7: number | string;
  hss7: number | string;
  daily_score?: number | string;
  note?: string | null;
  created_at: string;
  updated_at: string;
};

function normalizeEligibility(raw: RawEligibility): Uas7Eligibility {
  const eligible = raw.eligible === true || raw.eligible === 'true';
  const recordId =
    raw.medical_record_id !== undefined && raw.medical_record_id !== null && raw.medical_record_id !== ''
      ? Number(raw.medical_record_id)
      : null;
  return {
    eligible,
    medical_record_id: recordId !== null && Number.isFinite(recordId) ? recordId : null,
  };
}

function normalizeScore(raw: RawUas7Score, index = 0): Uas7Score {
  const iss7 = Number(raw.iss7);
  const hss7 = Number(raw.hss7);
  const daily = raw.daily_score !== undefined ? Number(raw.daily_score) : iss7 + hss7;
  return {
    id: raw.id !== undefined ? Number(raw.id) : index + 1,
    patient_id: Number(raw.patient_id),
    medical_record_id: Number(raw.medical_record_id),
    score_date: raw.score_date,
    iss7,
    hss7,
    daily_score: daily,
    note: raw.note ?? null,
    created_at: raw.created_at,
    updated_at: raw.updated_at,
  };
}

export const uas7Api = {
  checkEligibility: async (signal?: AbortSignal): Promise<Uas7Eligibility> =>
    normalizeEligibility(await api.get<RawEligibility>('/uas7-scores/eligibility', { signal })),

  createScore: async (payload: CreateUas7Payload): Promise<Uas7Score> =>
    normalizeScore(await api.post<RawUas7Score>('/uas7-scores', payload)),

  getHistory: async (patientId: number, signal?: AbortSignal): Promise<Uas7Score[]> => {
    const rows = await api.get<RawUas7Score[]>(`/uas7-scores/patient/${patientId}`, { signal });
    return (rows ?? []).map(normalizeScore);
  },
};
