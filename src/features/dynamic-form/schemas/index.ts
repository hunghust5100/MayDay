import { z } from 'zod';

import type { TemplateDetail } from '../types';

const required = (label: string) => z.string().trim().min(1, `Vui lòng nhập ${label}.`);
export const flagSchema = z.union([z.literal(0), z.literal(1)]);
const orderSchema = z.number().int('Thứ tự phải là số nguyên.').min(1, 'Thứ tự phải từ 1 trở lên.');
export const templateCodeSchema = required('mã mẫu')
  .max(255, 'Mã mẫu tối đa 255 ký tự.')
  .regex(/^[A-Z0-9_]+$/, 'Mã chỉ gồm chữ in hoa, số và dấu gạch dưới.')
  .refine((value) => !['all', 'sections', 'questions'].includes(value.toLowerCase()), 'Mã trùng từ khóa định tuyến.');
export const questionIdSchema = required('mã câu hỏi')
  .max(50, 'Mã câu hỏi tối đa 50 ký tự.')
  .regex(/^[A-Z0-9_]+$/, 'Mã chỉ gồm chữ in hoa, số và dấu gạch dưới.');

const templateFields = {
  name: required('tên mẫu phiếu'),
  description: z.string().trim(),
  version: required('phiên bản'),
  is_active: flagSchema,
};
export const createTemplateSchema = z.object({ code_template: templateCodeSchema, ...templateFields });
export const updateTemplateSchema = z.object({ code_template: z.string().trim(), ...templateFields });

export const sectionSchema = z.object({
  title: required('tiêu đề phần'),
  order: orderSchema,
  is_required: flagSchema,
  filled_by: z.enum(['patient', 'doctor', 'patdoc']),
});

export const optionSchema = z.object({
  id: z.number().int().positive().optional(),
  option_text: required('nội dung lựa chọn'),
  option_value: required('giá trị lựa chọn'),
  order: orderSchema,
  trigger_image_upload: flagSchema,
});
export const showIfAnswerSchema = z.object({ option_values: z.array(required('giá trị đáp án')) });
const scalar = z.union([z.string(), z.number()]);
export const conditionRuleSchema = z.object({
  question_id: questionIdSchema,
  operator: z.enum(['eq', 'neq', 'in', 'not_in', 'gt', 'gte', 'lt', 'lte']),
  value: z.union([scalar, z.array(scalar)]),
}).superRefine((rule, ctx) => {
  const requiresArray = rule.operator === 'in' || rule.operator === 'not_in';
  if (requiresArray !== Array.isArray(rule.value)) {
    ctx.addIssue({ code: 'custom', path: ['value'], message: requiresArray ? 'Phép so sánh này cần một danh sách giá trị.' : 'Phép so sánh này cần một giá trị đơn.' });
  }
});
export const conditionRulesSchema = z.object({
  logic: z.enum(['AND', 'OR']),
  rules: z.array(conditionRuleSchema),
});

export const questionSchema = z.object({
  question_id: questionIdSchema,
  question_text: required('nội dung câu hỏi'),
  type_question: z.enum(['text', 'number', 'date', 'radio', 'checkbox', 'image_upload']),
  order: orderSchema,
  placeholder: z.string().trim(),
  help_text: z.string().trim(),
  is_required: flagSchema,
  allow_image: flagSchema,
  parent_question_id: questionIdSchema.nullable(),
  show_if_answer: showIfAnswerSchema.nullable(),
  condition_rules: conditionRulesSchema.nullable(),
  options: z.array(optionSchema),
}).superRefine((question, ctx) => {
  const choices = question.type_question === 'radio' || question.type_question === 'checkbox';
  const issue = (path: string, message: string) => ctx.addIssue({ code: 'custom', path: [path], message });
  if (choices && !question.options.length) issue('options', 'Cần ít nhất một lựa chọn.');
  if (!choices && question.options.length) issue('options', 'Chỉ câu hỏi chọn một hoặc chọn nhiều mới có các lựa chọn.');
  if (new Set(question.options.map((option) => option.option_value)).size !== question.options.length) {
    issue('options', 'Giá trị lựa chọn không được trùng nhau.');
  }
  if (question.parent_question_id === question.question_id) issue('parent_question_id', 'Câu hỏi không thể là cha của chính nó.');
  if (question.show_if_answer && !question.parent_question_id) issue('show_if_answer', 'Cần chọn câu hỏi cha.');
});

/** Kiểm tra quan hệ dựa trên tree đã tải; backend vẫn kiểm tra định danh toàn hệ thống. */
export function questionSchemaForTemplate(template: TemplateDetail, sectionId: number, editingId?: string) {
  return questionSchema.superRefine((question, ctx) => {
    const section = template.sections.find((item) => item.section_id === sectionId);
    const all = template.sections.flatMap((item) => item.questions);
    const issue = (path: string, message: string) => ctx.addIssue({ code: 'custom', path: [path], message });
    if (!section) { issue('question_id', 'Không tìm thấy phần chứa câu hỏi.'); return; }
    if (editingId && question.question_id !== editingId) issue('question_id', 'Không được đổi mã câu hỏi.');
    if (!editingId && all.some((item) => item.question_id === question.question_id)) issue('question_id', 'Mã câu hỏi đã tồn tại trong mẫu.');
    const parent = section.questions.find((item) => item.question_id === question.parent_question_id);
    if (question.parent_question_id && !parent) issue('parent_question_id', 'Câu hỏi cha phải tồn tại trong cùng phần.');
    if (question.show_if_answer && parent) {
      if (!['radio', 'checkbox'].includes(parent.type_question)) issue('show_if_answer', 'Câu hỏi cha phải thuộc loại chọn một hoặc chọn nhiều.');
      if (question.show_if_answer.option_values.some((value) => !parent.options.some((option) => option.option_value === value))) {
        issue('show_if_answer', 'Đáp án điều kiện không thuộc lựa chọn của câu hỏi cha.');
      }
    }
    const visited = new Set([question.question_id]);
    let ancestor = parent;
    while (ancestor) {
      if (visited.has(ancestor.question_id)) { issue('parent_question_id', 'Quan hệ cha/con tạo vòng lặp.'); break; }
      visited.add(ancestor.question_id);
      ancestor = section.questions.find((item) => item.question_id === ancestor?.parent_question_id);
    }
    if (question.condition_rules?.rules.some((rule) => !all.some((item) => item.question_id === rule.question_id) && rule.question_id !== question.question_id)) {
      issue('condition_rules', 'Câu hỏi trong điều kiện phải thuộc cùng mẫu.');
    }
    // Editing a parent must not leave existing show-if children with invalid options/type.
    for (const child of section.questions.filter((item) => item.parent_question_id === editingId && item.show_if_answer)) {
      if (!['radio', 'checkbox'].includes(question.type_question) || child.show_if_answer!.option_values.some((value) => !question.options.some((option) => option.option_value === value))) {
        issue('options', `Câu hỏi “${child.question_text}” vẫn đang dùng lựa chọn cũ làm điều kiện. Hãy sửa điều kiện của câu đó trước.`);
      }
    }
    const existing = section.questions.find((item) => item.question_id === editingId);
    // Editing a referenced question must not leave other questions' condition_rules pointing to missing options or incompatible types.
    for (const dependent of all.filter((item) => item.question_id !== editingId && item.condition_rules?.rules.some((rule) => rule.question_id === editingId))) {
      for (const rule of dependent.condition_rules!.rules.filter((item) => item.question_id === editingId)) {
        const ruleValues = Array.isArray(rule.value) ? rule.value : [rule.value];
        const isChoice = question.type_question === 'radio' || question.type_question === 'checkbox';
        const wasChoice = existing?.type_question === 'radio' || existing?.type_question === 'checkbox';
        const typeIncompatible =
          (wasChoice && !isChoice) ||
          (['gt', 'gte', 'lt', 'lte'].includes(rule.operator) && question.type_question !== 'number' && question.type_question !== 'date') ||
          (existing && existing.type_question !== question.type_question && (existing.type_question === 'number' || existing.type_question === 'date' || question.type_question === 'number' || question.type_question === 'date'));
        const missingOption = isChoice && ruleValues.some((value) => !question.options.some((option) => option.option_value === value));
        if (typeIncompatible) {
          issue('type_question', `Câu hỏi “${dependent.question_text}” đang tham chiếu câu này trong điều kiện hiển thị. Hãy sửa điều kiện của câu đó trước.`);
          break;
        }
        if (missingOption) {
          issue('options', `Câu hỏi “${dependent.question_text}” vẫn đang dùng lựa chọn cũ trong điều kiện hiển thị. Hãy sửa điều kiện của câu đó trước.`);
          break;
        }
      }
    }
    const optionIds = question.options.flatMap((option) => option.id === undefined ? [] : [option.id]);
    if (new Set(optionIds).size !== optionIds.length) issue('options', 'Danh sách có lựa chọn bị lặp. Vui lòng tải lại câu hỏi và thử lại.');
    if (question.options.some((option) => option.id !== undefined && !existing?.options.some((item) => item.id === option.id))) {
      issue('options', 'Có lựa chọn không thuộc câu hỏi này. Vui lòng tải lại câu hỏi và thử lại.');
    }
  });
}
