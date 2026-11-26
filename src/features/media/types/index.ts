export type MediaAttachment = {
  id: string;
  user_id?: number;
  medical_record_id: number | null;
  question_id: string | null;
  file_url: string;
  file_name?: string;
  file_type: string;
  file_path?: string;
  media_type?: string;
  category?: string | null;
  description?: string | null;
  created_at: string;
};
export type UploadContext = {
  medical_record_id?: number;
  question_id?: string;
  category?: string;
  description?: string;
};
export type AnswerImage = {
  id: string;
  answer_id?: string;
  attachment_id?: string;
  option_value?: string | null;
  attachment: { attachment_id: string; file_url: string; file_name?: string };
};
