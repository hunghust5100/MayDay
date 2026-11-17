/** Mock persistence models, independent of features/core. Field names follow the REST contract. */
export type Flag = 0 | 1;
export type FormTemplateRow = { code_template: string; name: string; description: string | null; version: string; is_active: Flag; created_at: string; updated_at: string };
export type FormSectionRow = { section_id: number; template_id: string; title: string; order: number; is_required: Flag; filled_by: 'patient' | 'doctor' | 'patdoc' };
export type FormOptionRow = { id: number; question_id: string; option_text: string; option_value: string; order: number; trigger_image_upload: Flag };
export type FormShowIf = { option_values: string[] };
export type FormConditions = { logic: 'AND' | 'OR'; rules: { question_id: string; operator: 'eq' | 'neq' | 'in' | 'not_in' | 'gt' | 'gte' | 'lt' | 'lte'; value: string | number | (string | number)[] }[] };
export type FormQuestionRow = {
  question_id: string; section_id: number; parent_question_id: string | null; question_text: string;
  type_question: 'text' | 'number' | 'date' | 'radio' | 'checkbox' | 'image_upload'; placeholder: string | null; help_text: string | null;
  order: number; is_required: Flag; allow_image: Flag; show_if_answer: FormShowIf | null; condition_rules: FormConditions | null;
};
export type NotificationRow = { id: number; user_id: number; title: string; body: string; type: 'appointment' | 'lab_result' | 'prescription' | 'general'; avatar: string | null; reference_id: number | null; is_read: Flag; created_at: string; updated_at: string };
export type DeviceTokenRow = { id: number; user_id: number; fcm_token: string; device_type: 'android' | 'ios' | 'web'; created_at: string; updated_at: string };
