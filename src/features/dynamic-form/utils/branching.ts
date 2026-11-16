import type { ConditionRule, TemplateDetail, TemplateQuestion } from '../types';

export type Answer = string | number | string[] | null;
export type Answers = Record<string, Answer | undefined>;
export const isAnswered = (value: Answer | undefined) => value != null && (Array.isArray(value) ? value.length > 0 : typeof value === 'number' ? Number.isFinite(value) : value.trim().length > 0);

/** Checkbox equality means membership; in/not_in test overlap. Missing answers never satisfy a rule. */
export function evaluateRule(rule: ConditionRule, answer: Answer | undefined): boolean {
  if (!isAnswered(answer)) return false;
  const values = Array.isArray(answer) ? answer : [answer];
  const expected = rule.value;
  switch (rule.operator) {
    case 'eq': return values.some((value) => value === expected);
    case 'neq': return values.every((value) => value !== expected);
    case 'in': return Array.isArray(expected) && values.some((value) => expected.some((item) => item === value));
    case 'not_in': return Array.isArray(expected) && values.every((value) => !expected.some((item) => item === value));
    default: {
      // Ordering is defined for numbers and ISO dates, not arbitrary text or checkbox arrays.
      const numbers = typeof answer === 'number' && typeof expected === 'number' && Number.isFinite(answer) && Number.isFinite(expected);
      const dates = typeof answer === 'string' && typeof expected === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(answer) && /^\d{4}-\d{2}-\d{2}$/.test(expected);
      if (!numbers && !dates) return false;
      const a = answer as number; const b = expected as number;
      if (rule.operator === 'gt') return a > b;
      if (rule.operator === 'gte') return a >= b;
      if (rule.operator === 'lt') return a < b;
      if (rule.operator === 'lte') return a <= b;
      return false;
    }
  }
}

/** Pure evaluator. Resolves visible dependencies first; cycles/missing IDs fail closed, no stale hidden answers. */
export function evaluateBranching(template: TemplateDetail, answers: Answers) {
  const questions = new Map<string, { question: TemplateQuestion; sectionId: number }>();
  for (const section of template.sections) for (const question of section.questions) questions.set(question.question_id, { question, sectionId: section.section_id });
  const visible: Record<string, boolean> = {};
  const visiting = new Set<string>();
  const resolve = (id: string): boolean => {
    if (Object.hasOwn(visible, id)) return visible[id];
    const entry = questions.get(id);
    if (!entry || visiting.has(id)) return false;
    visiting.add(id);
    const q = entry.question;
    let result = true;
    if (q.parent_question_id) {
      const parent = questions.get(q.parent_question_id);
      result = parent?.sectionId === entry.sectionId && resolve(q.parent_question_id);
    }
    if (result && q.show_if_answer) {
      const parent = q.parent_question_id ? questions.get(q.parent_question_id)?.question : undefined;
      const answer = q.parent_question_id ? answers[q.parent_question_id] : undefined;
      const selected = Array.isArray(answer) ? answer : [answer];
      result = Boolean(parent && ['radio', 'checkbox'].includes(parent.type_question) && selected.some((value) => typeof value === 'string' && q.show_if_answer!.option_values.includes(value)));
    }
    if (result && q.condition_rules) {
      const rules = q.condition_rules.rules.map((rule) => resolve(rule.question_id) && evaluateRule(rule, answers[rule.question_id]));
      result = q.condition_rules.logic === 'AND' ? rules.every(Boolean) : rules.some(Boolean);
    }
    visiting.delete(id);
    visible[id] = result;
    return result;
  };
  for (const id of questions.keys()) resolve(id);
  const activeAnswers = Object.fromEntries(Object.entries(answers).filter(([id]) => visible[id]));
  return { visible, answers: activeAnswers };
}

export function requiresTriggeredImage(question: TemplateQuestion, answer: Answer | undefined) {
  const selected = Array.isArray(answer) ? answer : [answer];
  return question.options.some((option) => option.trigger_image_upload === 1 && selected.includes(option.option_value));
}

/** Required is conditional on visibility. Image presence is supplied separately from scalar answers. */
export function previewErrors(template: TemplateDetail, answers: Answers, imageCounts: Record<string, number>) {
  const { visible } = evaluateBranching(template, answers);
  const errors: Record<string, string> = {};
  for (const q of template.sections.flatMap((s) => s.questions)) {
    if (!visible[q.question_id]) continue;
    const hasImage = (imageCounts[q.question_id] ?? 0) > 0;
    if (q.is_required === 1 && !(q.type_question === 'image_upload' ? hasImage : isAnswered(answers[q.question_id]))) errors[q.question_id] = 'Vui lòng trả lời câu hỏi này.';
    if (q.type_question === 'number' && isAnswered(answers[q.question_id]) && (typeof answers[q.question_id] !== 'number' || !Number.isFinite(answers[q.question_id]))) errors[q.question_id] = 'Vui lòng nhập một số hợp lệ.';
    if (requiresTriggeredImage(q, answers[q.question_id]) && !hasImage) errors[q.question_id] = 'Lựa chọn này yêu cầu ít nhất một ảnh.';
  }
  return errors;
}
