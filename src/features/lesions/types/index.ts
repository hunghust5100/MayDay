import type { MediaAttachment } from '@/features/media';
export type Milestone = 'start' | 'peak' | 'normal';
export type Observation = {
  occurred_at: string | null;
  context_tags: string[];
  context_other: string | null;
  medication_name: string | null;
  medication_unit: string | null;
};
export type LesionEpisode = Observation & {
  episode_id: string;
  medical_record_id: number;
  patient_id: number;
  name: string;
  medication_taken_ago: string | null;
  description: string | null;
  created_at: string;
  updated_at: string;
};
export type LesionLocation = Observation & {
  lesion_location_id: string;
  episode_id: string;
  body_part: string;
  medication_take: string | null;
  created_at: string;
  updated_at: string;
};
export type LesionPhoto = {
  photo_id: string;
  episode_id: string;
  location_id: string | null;
  attachment_id: string;
  taken_at: string | null;
  milestone: Milestone;
  itch_score: number | null;
  pain_score: number | null;
  burn_score: number | null;
  hives_count: number | null;
  local_auas: number | null;
  annotated_url: string | null;
  created_at: string;
  updated_at: string;
  attachment: Pick<MediaAttachment, 'file_url'> & { attachment_id: string; file_name?: string };
};
export type EpisodeInput = Omit<LesionEpisode, 'episode_id' | 'patient_id' | 'created_at' | 'updated_at'>;
export type LocationInput = Omit<LesionLocation, 'lesion_location_id' | 'created_at' | 'updated_at'>;
export type PhotoInput = Omit<LesionPhoto, 'photo_id' | 'created_at' | 'updated_at' | 'attachment'>;
