/** Hợp đồng đọc mẫu dùng chung giữa renderer, bệnh án và mock. */
export type ConditionOperator = 'eq' | 'neq' | 'in' | 'not_in' | 'gt' | 'gte' | 'lt' | 'lte';

export type ConditionRule = {
  question_id: string;
  operator: ConditionOperator;
  value: unknown;
};

export type ConditionRules = {
  logic?: 'AND' | 'OR';
  rules?: ConditionRule[];
};

export type FormOption = {
  id: number | string;
  option_text: string;
  option_value: string;
  order?: number | string;
  trigger_image_upload?: string | number;
};

export type FormQuestion = {
  question_id: string;
  question_text: string;
  type_question: string;
  options?: FormOption[];
  order?: number | string;
  is_required?: boolean | string | number;
  placeholder?: string;
  help_text?: string;
  parent_question_id?: string | null;
  show_if_answer?: unknown;
  condition_rules?: ConditionRules | string | null;
  allow_image?: string | number;
};

export type FormSection = {
  section_id: string;
  title: string;
  filled_by?: 'patient' | 'doctor' | 'patdoc' | 'both';
  order?: number | string;
  questions: FormQuestion[];
};
export type ClinicalTemplate = { code_template: string; name: string; sections: FormSection[] };
export type FormActor = 'patient' | 'doctor' | 'readonly';
export type FormValue = string | number | string[] | null;
export type FormValues = Record<string, FormValue>;
export type AnswerInput = {
  question_id: string;
  question_option_id?: number | null;
  answer_text?: string | null;
  answer_value?: Record<string, unknown> | null;
};
