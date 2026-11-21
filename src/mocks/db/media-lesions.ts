export type AttachmentRow = {
  id: string;
  user_id: number;
  medical_record_id: number | null;
  question_id: string | null;
  file_path: string;
  file_url: string;
  file_name: string;
  file_type: string;
  media_type: string;
  category: string | null;
  description: string | null;
  created_at: string;
};
export type AnswerImageRow = {
  id: string;
  answer_id: number;
  attachment_id: string;
  option_value: string | null;
  created_at: string;
};
export type EpisodeRow = {
  episode_id: string;
  medical_record_id: number;
  patient_id: number;
  name: string;
  occurred_at: string | null;
  context_tags: string;
  context_other: string | null;
  medication_name: string | null;
  medication_taken_ago: string | null;
  medication_unit: string | null;
  description: string | null;
  created_at: string;
  updated_at: string;
};
export type LocationRow = {
  lesion_location_id: string;
  episode_id: string;
  body_part: string;
  occurred_at: string | null;
  context_tags: string;
  context_other: string | null;
  medication_name: string | null;
  medication_take: string | null;
  medication_unit: string | null;
  created_at: string;
  updated_at: string;
};
export type PhotoRow = {
  photo_id: string;
  episode_id: string;
  location_id: string | null;
  attachment_id: string;
  taken_at: string | null;
  milestone: 'start' | 'peak' | 'normal';
  itch_score: number | null;
  pain_score: number | null;
  burn_score: number | null;
  hives_count: number | null;
  local_auas: number | null;
  annotated_url: string | null;
  created_at: string;
  updated_at: string;
};
export function createMediaLesionSeed() {
  const stamp = '2026-10-02 09:30:00';
  return {
    media_attachments: new Map<string, AttachmentRow>(),
    answer_images: new Map<string, AnswerImageRow>(),
    lesion_episodes: new Map<string, EpisodeRow>([
      [
        '1',
        {
          episode_id: '1',
          medical_record_id: 1,
          patient_id: 15,
          name: 'Đợt nổi mẩn mẫu',
          occurred_at: stamp,
          context_tags: '["Sau ăn"]',
          context_other: null,
          medication_name: null,
          medication_taken_ago: null,
          medication_unit: null,
          description: 'Dữ liệu thử để ghi nhận vị trí và ảnh tiến triển.',
          created_at: stamp,
          updated_at: stamp,
        },
      ],
    ]),
    lesion_locations: new Map<string, LocationRow>([
      [
        '1',
        {
          lesion_location_id: '1',
          episode_id: '1',
          body_part: 'Cánh tay phải',
          occurred_at: stamp,
          context_tags: '[]',
          context_other: null,
          medication_name: null,
          medication_take: null,
          medication_unit: null,
          created_at: stamp,
          updated_at: stamp,
        },
      ],
    ]),
    lesion_photos: new Map<string, PhotoRow>(),
    next_media_id: 1,
    next_answer_image_id: 1,
    next_episode_id: 2,
    next_location_id: 2,
    next_photo_id: 1,
  };
}
