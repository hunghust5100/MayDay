import { api } from '@/core/api/client';
import { CreateUas7Payload, Uas7Eligibility, Uas7Score } from '../types';

export const uas7Api = {
  checkEligibility: (): Promise<Uas7Eligibility> => 
    api.get<Uas7Eligibility>('/api/v1/uas7-scores/eligibility'),
  
  createScore: (payload: CreateUas7Payload): Promise<Uas7Score> => 
    api.post<Uas7Score>('/api/v1/uas7-scores', payload),
    
  getHistory: (patientId: string): Promise<Uas7Score[]> => 
    api.get<Uas7Score[]>(`/api/v1/uas7-scores/patient/${patientId}`),
};