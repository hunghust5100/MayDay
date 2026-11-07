import type { Gender } from '@/shared/types';

/** Giới tính theo enum của API (`male` | `female` | `other`). */
export const GENDER_OPTIONS: { value: Gender; label: string }[] = [
  { value: 'male', label: 'Nam' },
  { value: 'female', label: 'Nữ' },
  { value: 'other', label: 'Khác' },
];

export const genderLabel = (gender: Gender | null | undefined) =>
  GENDER_OPTIONS.find((option) => option.value === gender)?.label;
