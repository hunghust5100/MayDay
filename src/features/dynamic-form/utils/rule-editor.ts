import type { ConditionOperator, ConditionRule, ConditionRules, TemplateQuestion } from '../types';

export type RuleDraft = { question_id: string; operator: ConditionOperator; values: (string | number)[] };
export type RulesDraft = { logic: 'AND' | 'OR'; rules: RuleDraft[] } | null;
export const multipleValues = (operator: ConditionOperator) => operator === 'in' || operator === 'not_in';
export const OPERATOR_LABELS: Record<ConditionOperator, string> = {
  eq: 'Bằng', neq: 'Khác', in: 'Là một trong các giá trị', not_in: 'Không thuộc các giá trị',
  gt: 'Lớn hơn', gte: 'Lớn hơn hoặc bằng', lt: 'Nhỏ hơn', lte: 'Nhỏ hơn hoặc bằng',
};
export function operatorLabels(question?: TemplateQuestion): Record<ConditionOperator, string> {
  if (question?.type_question === 'date') return { ...OPERATOR_LABELS, gt: 'Sau ngày', gte: 'Từ ngày trở đi', lt: 'Trước ngày', lte: 'Đến hết ngày' };
  if (question?.type_question === 'checkbox') return { ...OPERATOR_LABELS, eq: 'Có chọn', neq: 'Không chọn', in: 'Có chọn ít nhất một đáp án', not_in: 'Không chọn đáp án nào trong nhóm' };
  if (question?.type_question === 'radio') return { ...OPERATOR_LABELS, eq: 'Chọn đáp án', neq: 'Không chọn đáp án', in: 'Chọn một trong các đáp án', not_in: 'Không chọn các đáp án' };
  return OPERATOR_LABELS;
}
export const rulesToDraft = (rules?: ConditionRules | null): RulesDraft => rules ? {
  logic: rules.logic, rules: rules.rules.map(({ value, ...rule }) => ({ ...rule, values: Array.isArray(value) ? [...value] : [value] })),
} : null;

/** Serialize UI fields to the unchanged API contract; users never enter JSON. */
export function parseRulesDraft(draft: RulesDraft, questions: TemplateQuestion[]): ConditionRules | null {
  if (!draft) return null;
  if (!draft.rules.length) throw new Error('Hãy thêm ít nhất một điều kiện hoặc tắt điều kiện hiển thị.');
  return { logic: draft.logic, rules: draft.rules.map(({ values, ...rule }, index) => {
    const question = questions.find((q) => q.question_id === rule.question_id);
    const fail = (message: string): never => { throw new Error(`Điều kiện ${index + 1}: ${message}`); };
    if (!question) fail('hãy chọn câu hỏi để so sánh.');
    if (!values.length) fail('hãy chọn hoặc nhập giá trị so sánh.');
    const parsed = values.map((value) => {
      if ((question?.type_question === 'radio' || question?.type_question === 'checkbox') && !question.options.some((option) => option.option_value === value)) fail('đáp án đã thay đổi, hãy chọn lại đáp án.');
      if (question?.type_question === 'number') {
        const text = String(value).trim().replace(',', '.');
        if (!/^[+-]?(?:\d+(?:\.\d*)?|\.\d+)$/.test(text) || !Number.isFinite(Number(text))) fail('vui lòng nhập số hợp lệ.');
        return Number(text);
      }
      if (question?.type_question === 'date') {
        const text = String(value);
        const date = new Date(`${text}T00:00:00Z`);
        if (!/^\d{4}-\d{2}-\d{2}$/.test(text) || !Number.isFinite(date.getTime()) || date.toISOString().slice(0, 10) !== text) fail('hãy chọn ngày hợp lệ.');
      }
      return value;
    });
    return { ...rule, value: multipleValues(rule.operator) ? parsed : parsed[0] };
  }) };
}

export function describeRule(rule: ConditionRule, questions: TemplateQuestion[]) {
  const question = questions.find((q) => q.question_id === rule.question_id);
  const values = Array.isArray(rule.value) ? rule.value : [rule.value];
  const display = values.map((v) => {
    const option = question?.options.find((o) => o.option_value === v);
    if (option) return option.option_text;
    if (question?.type_question === 'radio' || question?.type_question === 'checkbox') return 'Lựa chọn không còn tồn tại';
    if (question?.type_question === 'date' && typeof v === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(v)) return v.split('-').reverse().join('/');
    return String(v);
  }).join(', ');
  return `${question?.question_text ?? 'Câu hỏi không còn tồn tại'} — ${operatorLabels(question)[rule.operator].toLowerCase()}: ${display}`;
}

/** Non-security identifiers: generated once on creation, never changed when renaming. */
export const newContentCode = (prefix: 'Q' | 'OPT') => `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 12)}`.toUpperCase();

export const QUESTION_FIELD_LABELS: Record<string, string> = {
  question_id: 'Câu hỏi', question_text: 'Nội dung câu hỏi', type_question: 'Loại câu hỏi', order: 'Thứ tự câu hỏi',
  placeholder: 'Gợi ý nhập liệu', help_text: 'Giải thích thêm', is_required: 'Câu hỏi bắt buộc', allow_image: 'Ảnh đính kèm',
  parent_question_id: 'Câu hỏi cha', show_if_answer: 'Đáp án để hiện câu con', condition_rules: 'Điều kiện hiển thị', options: 'Các lựa chọn',
};
