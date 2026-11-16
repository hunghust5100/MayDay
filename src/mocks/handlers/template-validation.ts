import { reject } from '../core/http';
import type { Body } from '../core/validate';
import type { Flag, FormConditions, FormOptionRow, FormQuestionRow, FormSectionRow, FormShowIf } from '../db/form-types';
import { db, nextId } from '../db/store';

export function text(body: Body, key: string, fallback?: string): string {
  const value = body[key] === undefined ? fallback : body[key];
  if (value === undefined || value === null || value === '') reject('2001');
  if (typeof value !== 'string') reject('2002');
  if (!value.trim()) reject('2001');
  return value.trim();
}
export function nullableText(value: unknown, fallback: string | null): string | null {
  if (value === undefined) return fallback;
  if (value === null) return null;
  if (typeof value !== 'string') reject('2002');
  return value.trim();
}
export function integer(value: unknown, fallback?: number) {
  if (value === undefined) { if (fallback !== undefined) return fallback; reject('2001'); }
  if (typeof value !== 'number' || !Number.isSafeInteger(value)) reject('2002');
  return value;
}
export function order(value: unknown, fallback?: number) {
  const n = integer(value, fallback); if (n < 1) reject('2003'); return n;
}
export function flag(value: unknown, fallback: Flag): Flag {
  const n = integer(value, fallback); if (n !== 0 && n !== 1) reject('2003'); return n;
}
export function identifier(value: string, max: number) {
  if (!/^[A-Z0-9_]+$/.test(value) || value.length > max) reject('2003'); return value;
}
export function sectionFields(body: Body, existing?: FormSectionRow): Omit<FormSectionRow, 'section_id' | 'template_id'> {
  const filled_by = text(body, 'filled_by', existing?.filled_by ?? 'patient');
  if (filled_by !== 'patient' && filled_by !== 'doctor' && filled_by !== 'patdoc') reject('2003');
  return { title: text(body, 'title', existing?.title), order: order(body.order, existing?.order), is_required: flag(body.is_required, existing?.is_required ?? 0), filled_by };
}
function json(value: unknown) {
  if (typeof value === 'string') { try { return JSON.parse(value); } catch { reject('2003'); } }
  return value;
}
const scalar = (value: unknown): value is string | number => typeof value === 'string' || (typeof value === 'number' && Number.isFinite(value));
export function showIf(value: unknown): FormShowIf | null {
  const v = json(value);
  if (v == null) return null;
  if (typeof v !== 'object' || Array.isArray(v) || !Array.isArray(v.option_values) || v.option_values.some((x: unknown) => typeof x !== 'string' || !x.trim())) reject('2003');
  return { option_values: v.option_values };
}
export function conditions(value: unknown): FormConditions | null {
  const v = json(value);
  if (v == null) return null;
  if (typeof v !== 'object' || Array.isArray(v) || !['AND', 'OR'].includes(v.logic) || !Array.isArray(v.rules)) reject('2003');
  for (const r of v.rules) {
    if (!r || typeof r !== 'object' || typeof r.question_id !== 'string' || !/^[A-Z0-9_]{1,50}$/.test(r.question_id) || !['eq', 'neq', 'in', 'not_in', 'gt', 'gte', 'lt', 'lte'].includes(r.operator)) reject('2003');
    if (r.operator === 'in' || r.operator === 'not_in') { if (!Array.isArray(r.value) || !r.value.every(scalar)) reject('2003'); }
    else if (!scalar(r.value)) reject('2003');
  }
  return { logic: v.logic, rules: v.rules };
}
export const optionsFor = (id: string) => [...db.question_options.values()].filter((o) => o.question_id === id).sort((a, b) => a.order - b.order);
export function questionFields(body: Body, sectionId: number, existing?: FormQuestionRow): FormQuestionRow {
  const question_id = existing?.question_id ?? identifier(text(body, 'question_id'), 50);
  if (!existing && db.questions.has(question_id)) reject('2003');
  const type = text(body, 'type_question', existing?.type_question);
  if (!['text', 'number', 'date', 'radio', 'checkbox', 'image_upload'].includes(type)) reject('2003');
  return {
    question_id, section_id: sectionId, question_text: text(body, 'question_text', existing?.question_text), type_question: type as FormQuestionRow['type_question'],
    order: order(body.order, existing?.order), is_required: flag(body.is_required, existing?.is_required ?? 0), allow_image: flag(body.allow_image, existing?.allow_image ?? 0),
    placeholder: nullableText(body.placeholder, existing?.placeholder ?? null), help_text: nullableText(body.help_text, existing?.help_text ?? null),
    parent_question_id: nullableText(body.parent_question_id, existing?.parent_question_id ?? null),
    show_if_answer: body.show_if_answer === undefined ? existing?.show_if_answer ?? null : showIf(body.show_if_answer),
    condition_rules: body.condition_rules === undefined ? existing?.condition_rules ?? null : conditions(body.condition_rules),
  };
}
export function questionOptions(body: Body, question: FormQuestionRow, existing?: FormQuestionRow): FormOptionRow[] {
  const old = existing ? optionsFor(existing.question_id) : [];
  const choices = ['radio', 'checkbox'].includes(question.type_question);
  const changed = existing && question.type_question !== existing.type_question;
  if (body.options === undefined && choices && (!existing || changed)) reject('2001');
  if (body.options === undefined) return choices ? old : [];
  if (!Array.isArray(body.options)) reject('2002');
  if (choices && body.options.length === 0) reject('2001');
  if (!choices && body.options.length) reject('2003');
  let next = nextId(db.question_options);
  const rows = body.options.map((raw: unknown, i: number): FormOptionRow => {
    if (!raw || typeof raw !== 'object' || Array.isArray(raw)) reject('2002');
    const o = raw as Body;
    const id = o.id === undefined ? undefined : integer(o.id);
    const prev = old.find((row) => row.id === id);
    if (id !== undefined && (!existing || !prev)) reject('2003');
    return { id: id ?? next++, question_id: question.question_id, option_text: text(o, 'option_text'), option_value: text(o, 'option_value'),
      order: order(o.order, existing ? prev?.order ?? Math.max(0, ...old.map((item) => item.order)) + i + 1 : undefined),
      trigger_image_upload: flag(o.trigger_image_upload, prev?.trigger_image_upload ?? 0) };
  });
  if (new Set(rows.map((r) => r.id)).size !== rows.length || new Set(rows.map((r) => r.option_value)).size !== rows.length) reject('2003');
  return rows;
}
export function validateRelations(q: FormQuestionRow, options: FormOptionRow[], templateId: string, editing: boolean) {
  if (q.parent_question_id === q.question_id) reject('2003');
  const parent = q.parent_question_id ? db.questions.get(q.parent_question_id) : undefined;
  if (q.parent_question_id && !parent) reject('4104');
  if (parent && parent.section_id !== q.section_id) reject('2003');
  const visited = new Set([q.question_id]); let ancestor = parent;
  while (ancestor) {
    if (visited.has(ancestor.question_id)) reject('2003');
    visited.add(ancestor.question_id);
    ancestor = ancestor.parent_question_id ? db.questions.get(ancestor.parent_question_id) : undefined;
  }
  if (q.show_if_answer && (!parent || !['radio', 'checkbox'].includes(parent.type_question) || q.show_if_answer.option_values.some((v) => !optionsFor(parent.question_id).some((o) => o.option_value === v)))) reject('2003');
  for (const r of q.condition_rules?.rules ?? []) {
    const referenced = r.question_id === q.question_id ? q : db.questions.get(r.question_id);
    if (!referenced) reject('4104');
    if (db.template_sections.get(referenced.section_id)?.template_id !== templateId) reject('2003');
  }
  if (editing) for (const child of db.questions.values()) {
    if (child.parent_question_id === q.question_id && child.show_if_answer && (!['radio', 'checkbox'].includes(q.type_question) || child.show_if_answer.option_values.some((v) => !options.some((o) => o.option_value === v)))) reject('2003');
  }
}
