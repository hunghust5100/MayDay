import type { AnswerInput, ClinicalTemplate, FormActor, FormQuestion, FormValues } from '@/shared/types/clinical-form';

export const isRequired = (value: unknown) => value === true || value === 1 || value === '1';
export const canFill = (filledBy: string | undefined, actor: FormActor) =>
  actor !== 'readonly' && (!filledBy || filledBy === 'both' || filledBy === actor);
export const ordered = <T extends { order?: string | number }>(items: T[]) =>
  [...items].sort((a, b) => Number(a.order ?? 0) - Number(b.order ?? 0));

export function questionVisible(
  question: FormQuestion,
  values: FormValues,
  questions: FormQuestion[],
  seen = new Set<string>(),
): boolean {
  if (!question.parent_question_id) return true;
  if (seen.has(question.question_id)) return false;
  seen.add(question.question_id);
  const parent = questions.find((q) => q.question_id === question.parent_question_id);
  if (!parent || !questionVisible(parent, values, questions, seen)) return false;
  let condition = question.show_if_answer;
  if (typeof condition === 'string') {
    try {
      condition = JSON.parse(condition);
    } catch {
      /* raw option value */
    }
  }
  const selected = values[parent.question_id];
  if (selected == null || selected === '' || (Array.isArray(selected) && !selected.length)) return false;
  // JSON được hiểu là một giá trị hoặc mảng các option_value; không thực thi biểu thức từ server.
  const expected = Array.isArray(condition) ? condition : [condition];
  return expected.some((v) =>
    Array.isArray(selected) ? selected.includes(String(v)) : String(selected) === String(v),
  );
}

export function validateForm(template: ClinicalTemplate, values: FormValues, actor: FormActor): Record<string, string> {
  const errors: Record<string, string> = {};
  const questions = template.sections.flatMap((s) => s.questions);
  for (const section of template.sections)
    for (const q of section.questions) {
      if (!canFill(section.filled_by, actor) || !questionVisible(q, values, questions)) continue;
      const value = values[q.question_id];
      if (
        isRequired(q.is_required) &&
        (value == null ||
          value === '' ||
          (typeof value === 'string' && !value.trim()) ||
          (Array.isArray(value) && !value.length))
      )
        errors[q.question_id] = 'Vui lòng trả lời câu hỏi này';
      if (
        q.type_question === 'number' &&
        value != null &&
        value !== '' &&
        (typeof value !== 'number' || !Number.isFinite(value))
      )
        errors[q.question_id] = 'Vui lòng nhập số hợp lệ';
      if ((q.type_question === 'radio' || q.type_question === 'checkbox') && value != null && value !== '') {
        const selected = Array.isArray(value) ? value : [value];
        if (selected.some((v) => !q.options?.some((o) => o.option_value === v)))
          errors[q.question_id] = 'Lựa chọn không hợp lệ';
        if (selected.some((v) => q.options?.some((o) => o.option_value === v && isRequired(o.trigger_image_upload))))
          errors[q.question_id] = 'Lựa chọn này cần ảnh; chức năng ảnh chưa được tích hợp';
      }
      if (!['text', 'number', 'radio', 'checkbox'].includes(q.type_question) && isRequired(q.is_required))
        errors[q.question_id] = 'Loại câu hỏi bắt buộc này chưa được hỗ trợ';
    }
  return errors;
}

export function serializeAnswers(template: ClinicalTemplate, values: FormValues, actor: FormActor): AnswerInput[] {
  const questions = template.sections.flatMap((s) => s.questions);
  return template.sections.flatMap((section) =>
    canFill(section.filled_by, actor)
      ? section.questions.flatMap((q): AnswerInput[] => {
          const value = values[q.question_id];
          if (!['text', 'number', 'radio', 'checkbox'].includes(q.type_question)) return [];
          if (!questionVisible(q, values, questions) || value == null || value === '')
            return [{ question_id: q.question_id, question_option_id: null, answer_text: null, answer_value: null }];
          if (q.type_question === 'radio')
            return [
              {
                question_id: q.question_id,
                question_option_id: Number(q.options?.find((o) => o.option_value === value)?.id),
                answer_text: null,
                answer_value: { value },
              },
            ];
          if (q.type_question === 'text')
            return [
              { question_id: q.question_id, question_option_id: null, answer_text: String(value), answer_value: null },
            ];
          return [{ question_id: q.question_id, question_option_id: null, answer_text: null, answer_value: { value } }];
        })
      : [],
  );
}
