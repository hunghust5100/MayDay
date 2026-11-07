import { api } from '@/core/api';

import type { PatientProfile, UpdateProfileRequest } from '../types';

export const profileApi = {
  /** profile01 */
  get: (signal?: AbortSignal) => api.get<PatientProfile>('/profile', { signal }),
  /** profile02 */
  update: (body: UpdateProfileRequest) => api.put<PatientProfile>('/profile', body),
};
