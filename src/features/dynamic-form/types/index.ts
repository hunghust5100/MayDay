export type Flag = 0 | 1;
export type QuestionType = 'text' | 'number' | 'date' | 'radio' | 'checkbox' | 'image_upload';
export type FilledBy = 'patient' | 'doctor' | 'patdoc';
export type ConditionOperator = 'eq' | 'neq' | 'in' | 'not_in' | 'gt' | 'gte' | 'lt' | 'lte';
export type ShowIfAnswer = { option_values: string[] };
export type ConditionRule = {
  question_id: string;
  operator: ConditionOperator;
  value: string | number | (string | number)[];
};
export type ConditionRules = { logic: 'AND' | 'OR'; rules: ConditionRule[] };

export type TemplateSummary = {
  code_template: string;
  name: string;
  description?: string | null;
  version: string;
  is_active: Flag;
  created_at: string;
  updated_at: string;
};

export type QuestionOption = {
  id: number;
  option_text: string;
  option_value: string;
  order: number;
  trigger_image_upload: Flag;
};

/** Dạng câu hỏi trong tree tmpl03 không lặp lại section_id. */
export type TemplateQuestion = {
  question_id: string;
  parent_question_id?: string | null;
  question_text: string;
  type_question: QuestionType;
  placeholder?: string | null;
  help_text?: string | null;
  order: number;
  is_required: Flag;
  allow_image: Flag;
  show_if_answer?: ShowIfAnswer | null;
  condition_rules?: ConditionRules | null;
  options: QuestionOption[];
};

export type TemplateSection = {
  section_id: number;
  title: string;
  order: number;
  is_required: Flag;
  filled_by: FilledBy;
  questions: TemplateQuestion[];
};
export type TemplateDetail = TemplateSummary & { sections: TemplateSection[] };
export type TemplateFilters = { is_active?: Flag };
export type CreateTemplateRequest = {
  code_template: string;
  name: string;
  description?: string;
  version?: string;
  is_active?: Flag;
};
export type UpdateTemplateRequest = Partial<Omit<CreateTemplateRequest, 'code_template'>>;
export type CreateSectionRequest = {
  title: string;
  order: number;
  is_required?: Flag;
  filled_by?: FilledBy;
};
export type UpdateSectionRequest = Partial<CreateSectionRequest>;
export type SectionResult = Omit<TemplateSection, 'questions'> & { template_id: string };
export type OptionInput = {
  id?: number;
  option_text: string;
  option_value: string;
  order: number;
  trigger_image_upload?: Flag;
};
export type CreateQuestionRequest = {
  question_id: string;
  question_text: string;
  type_question: QuestionType;
  order: number;
  placeholder?: string;
  help_text?: string;
  is_required?: Flag;
  allow_image?: Flag;
  parent_question_id?: string | null;
  show_if_answer?: ShowIfAnswer | null;
  condition_rules?: ConditionRules | null;
  options?: Omit<OptionInput, 'id'>[];
};
export type UpdateQuestionRequest = Partial<Omit<CreateQuestionRequest, 'question_id' | 'options'>> & {
  options?: (Omit<OptionInput, 'order'> & { order?: number })[];
};
export type QuestionResult = TemplateQuestion & { section_id: number };
