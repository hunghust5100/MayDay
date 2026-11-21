import type {
  AnswerInput,
  ClinicalTemplate,
  ConditionRule,
  ConditionRules,
  FormActor,
  FormQuestion,
  FormValue,
  FormValues,
  ImageSelections,
} from '@/shared/types/clinical-form';

export const SUPPORTED_QUESTION_TYPES = ['text', 'number', 'date', 'radio', 'checkbox'] as const;

const isSupportedQuestionType = (type: string) =>
  (SUPPORTED_QUESTION_TYPES as readonly string[]).includes(type);

const isValidApiDate = (value: unknown) => {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00Z`);
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value;
};

export const isRequired = (value: unknown) => value === true || value === 1 || value === '1';

export const canFill = (filledBy: string | undefined, actor: FormActor) =>
  actor !== 'readonly' && (!filledBy || filledBy === 'both' || filledBy === 'patdoc' || filledBy === actor);

export const ordered = <T extends { order?: string | number }>(items: T[]) =>
  [...items].sort((a, b) => Number(a.order ?? 0) - Number(b.order ?? 0));

function parseJsonIfString(raw: unknown): unknown {
  if (typeof raw !== 'string') return raw;
  try {
    return JSON.parse(raw);
  } catch {
    return raw;
  }
}

function hasAnswerValue(value: FormValue | undefined): value is FormValue {
  return !(value == null || value === '' || (Array.isArray(value) && !value.length));
}

function extractExpectedOptionValues(rawCondition: unknown): string[] {
  const parsed = parseJsonIfString(rawCondition);
  if (parsed == null || parsed === '') return [];
  if (Array.isArray(parsed)) return parsed.map(String);
  if (typeof parsed === 'object' && 'option_values' in parsed) {
    const optionValues = (parsed as { option_values?: unknown }).option_values;
    if (Array.isArray(optionValues)) return optionValues.map(String);
  }
  return [String(parsed)];
}

function compareOrdered(actual: FormValue, target: unknown, operator: 'gt' | 'gte' | 'lt' | 'lte'): boolean {
  if (Array.isArray(actual)) return false;
  const numActual = typeof actual === 'number' ? actual : Number(actual);
  const numTarget = typeof target === 'number' ? target : Number(target);
  const useNumber = Number.isFinite(numActual) && Number.isFinite(numTarget) && actual !== '' && target !== '';
  const left = useNumber ? numActual : String(actual);
  const right = useNumber ? numTarget : String(target ?? '');
  if (operator === 'gt') return left > right;
  if (operator === 'gte') return left >= right;
  if (operator === 'lt') return left < right;
  return left <= right;
}

function evaluateRule(
  rule: ConditionRule,
  values: FormValues,
  questions: FormQuestion[],
  seen: Set<string>,
): boolean {
  const targetQuestion = questions.find((q) => q.question_id === rule.question_id);
  if (targetQuestion && !questionVisible(targetQuestion, values, questions, new Set(seen))) return false;
  const actual = values[rule.question_id];
  if (!hasAnswerValue(actual)) return false;

  const expectedList = Array.isArray(rule.value) ? rule.value.map(String) : [];
  switch (rule.operator) {
    case 'eq':
      return Array.isArray(actual) ? actual.includes(String(rule.value)) : String(actual) === String(rule.value);
    case 'neq':
      return Array.isArray(actual) ? !actual.includes(String(rule.value)) : String(actual) !== String(rule.value);
    case 'in':
      return Array.isArray(actual)
        ? actual.some((item) => expectedList.includes(item))
        : expectedList.includes(String(actual));
    case 'not_in':
      return Array.isArray(actual)
        ? actual.every((item) => !expectedList.includes(item))
        : !expectedList.includes(String(actual));
    case 'gt':
    case 'gte':
    case 'lt':
    case 'lte':
      return compareOrdered(actual, rule.value, rule.operator);
    default:
      return false;
  }
}

export function questionVisible(
  question: FormQuestion,
  values: FormValues,
  questions: FormQuestion[],
  seen = new Set<string>(),
): boolean {
  if (seen.has(question.question_id)) return false;
  const nextSeen = new Set(seen);
  nextSeen.add(question.question_id);

  let parent: FormQuestion | undefined;
  if (question.parent_question_id) {
    parent = questions.find((q) => q.question_id === question.parent_question_id);
    if (!parent || !questionVisible(parent, values, questions, nextSeen)) return false;
  }

  const expectedOptions = extractExpectedOptionValues(question.show_if_answer);
  if (expectedOptions.length) {
    if (!parent) return false;
    const selected = values[parent.question_id];
    if (!hasAnswerValue(selected)) return false;
    const matched = expectedOptions.some((expected) =>
      Array.isArray(selected) ? selected.includes(expected) : String(selected) === expected,
    );
    if (!matched) return false;
  }

  const parsedRules = parseJsonIfString(question.condition_rules) as ConditionRules | null | undefined;
  if (parsedRules && typeof parsedRules === 'object' && Array.isArray(parsedRules.rules) && parsedRules.rules.length) {
    const check = (rule: ConditionRule) => evaluateRule(rule, values, questions, nextSeen);
    const passed = parsedRules.logic === 'OR' ? parsedRules.rules.some(check) : parsedRules.rules.every(check);
    if (!passed) return false;
  }

  return true;
}

export function validateForm(
  template: ClinicalTemplate,
  values: FormValues,
  actor: FormActor,
  options: { images?: ImageSelections; deferImageRequirements?: boolean } = {},
): Record<string, string> {
  const errors: Record<string, string> = {};
  const questions = template.sections.flatMap((s) => s.questions);
  for (const section of template.sections)
    for (const q of section.questions) {
      if (!canFill(section.filled_by, actor) || !questionVisible(q, values, questions)) continue;
      const value = values[q.question_id];
      const attached = options.images?.[q.question_id] ?? [];
      if (new Set(attached.map((a) => a.attachment_id)).size !== attached.length)
        errors[q.question_id] = 'Mỗi ảnh chỉ được gắn một lần vào cùng câu trả lời';
      if (
        isRequired(q.is_required) &&
        !(q.type_question === 'image_upload' && options.images !== undefined) &&
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
      if (q.type_question === 'date' && value != null && value !== '' && !isValidApiDate(value))
        errors[q.question_id] = 'Vui lòng chọn ngày hợp lệ';
      if ((q.type_question === 'radio' || q.type_question === 'checkbox') && value != null && value !== '') {
        const selected = Array.isArray(value) ? value : [value];
        if (selected.some((v) => !q.options?.some((o) => o.option_value === v)))
          errors[q.question_id] = 'Lựa chọn không hợp lệ';
        if (
          !options.deferImageRequirements &&
          selected.some(
            (v) =>
              q.options?.some((o) => o.option_value === v && isRequired(o.trigger_image_upload)) &&
              !options.images?.[q.question_id]?.some((image) => image.option_value === v),
          )
        )
          errors[q.question_id] =
            options.images === undefined
              ? 'Lựa chọn này cần ảnh; chức năng ảnh chưa được tích hợp'
              : 'Vui lòng đính kèm ảnh cho từng lựa chọn yêu cầu ảnh';
      }
      if (
        q.type_question === 'image_upload' &&
        options.images !== undefined &&
        isRequired(q.is_required) &&
        !options.deferImageRequirements &&
        !options.images[q.question_id]?.length
      )
        errors[q.question_id] = 'Vui lòng chọn hoặc tải lên ít nhất một ảnh';
      if (
        !isSupportedQuestionType(q.type_question) &&
        !(q.type_question === 'image_upload' && options.images !== undefined) &&
        isRequired(q.is_required)
      )
        errors[q.question_id] = 'Loại câu hỏi bắt buộc này chưa được hỗ trợ';
    }
  return errors;
}

export function serializeAnswers(
  template: ClinicalTemplate,
  values: FormValues,
  actor: FormActor,
  images?: ImageSelections,
): AnswerInput[] {
  const questions = template.sections.flatMap((s) => s.questions);
  return template.sections.flatMap((section) =>
    canFill(section.filled_by, actor)
      ? section.questions.flatMap((q): AnswerInput[] => {
          const value = values[q.question_id];
          // Image mappings need the answer row ID, obtained after saving this placeholder.
          if (q.type_question === 'image_upload' && images !== undefined)
            return [
              { question_id: q.question_id, answer_text: null, answer_value: null, question_option_id: null },
            ];
          if (!isSupportedQuestionType(q.type_question)) return [];
          if (!questionVisible(q, values, questions) || value == null || value === '')
            return [
              { question_id: q.question_id, question_option_id: null, answer_text: null, answer_value: null },
            ];
          if (q.type_question === 'radio')
            return [
              {
                question_id: q.question_id,
                question_option_id: Number(q.options?.find((o) => o.option_value === value)?.id),
                answer_text: null,
                answer_value: { value },
              },
            ];
          if (q.type_question === 'text' || q.type_question === 'date')
            return [
              {
                question_id: q.question_id,
                question_option_id: null,
                answer_text: String(value),
                answer_value: null,
              },
            ];
          return [
            {
              question_id: q.question_id,
              question_option_id: null,
              answer_text: null,
              answer_value: { value },
            },
          ];
        })
      : [],
  );
}
