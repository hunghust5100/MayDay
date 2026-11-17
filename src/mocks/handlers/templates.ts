import { ROLE } from '../config';
import { authenticate } from '../core/auth';
import { ok, reject, type MockRequest } from '../core/http';
import { positiveId, strictInteger, strictPaging } from '../core/module-validate';
import type { RouteDef } from '../core/router';
import { readBody, requireAny } from '../core/validate';
import type { FormQuestionRow, FormTemplateRow } from '../db/form-types';
import { db, isPatientRole, nextId, nowString } from '../db/store';
import { readBuilderTemplate, readClinicalTemplate, templateInUse } from '../db/template-reader';
import { flag, identifier, nullableText, optionsFor, questionFields, questionOptions, sectionFields, text, validateRelations } from './template-validation';

/** Kiểm tra quyền thiết kế mẫu động qua RBAC `manage_templates` (Admin mặc định được phép, Bệnh nhân luôn bị chặn 3102). */
function designer(req: MockRequest) {
  const { user } = authenticate(req);
  if (user.role_id === ROLE.ADMIN) return;
  if (isPatientRole(user.role_id)) reject('3102');
  const allowed = db.role_permissions.some((rp) => rp.role_id === user.role_id && db.permissions.get(rp.permission_id)?.name === 'manage_templates');
  if (allowed) return;
  if ([ROLE.DOCTOR, ROLE.INTERN_DOCTOR, ROLE.HEAD_OF_DEPARTMENT].some((role) => role === user.role_id)) reject('3101');
  reject('3102');
}
const templateById = (id: string) => { const row = db.form_templates.get(id); if (!row) reject('4101'); return row; };
const sectionById = (id: number) => { const row = db.template_sections.get(id); if (!row) reject('4103'); return row; };
const questionById = (id: string) => { const row = db.questions.get(id); if (!row) reject('4104'); return row; };
function touch(code: string) {
  const row = templateById(code);
  // Monotonic at API second precision, even when several edits happen within one second.
  const previous = new Date(row.updated_at.replace(' ', 'T')).getTime();
  const next = new Date(Math.max(Date.now(), previous + 1000));
  const pad = (n: number) => String(n).padStart(2, '0');
  row.updated_at = `${next.getFullYear()}-${pad(next.getMonth() + 1)}-${pad(next.getDate())} ${pad(next.getHours())}:${pad(next.getMinutes())}:${pad(next.getSeconds())}`;
}
function questionResult(row: FormQuestionRow) {
  return { ...row, options: optionsFor(row.question_id).map(({ question_id: _id, ...option }) => option) };
}
function detail(req: MockRequest) {
  authenticate(req);
  const template = readBuilderTemplate(req.params.id) ?? readClinicalTemplate(req.params.id);
  if (!template) reject('4101');
  return ok(template);
}
function list(req: MockRequest) {
  const { user } = authenticate(req); const { offset, limit } = strictPaging(req);
  let active: number | undefined;
  if (user.role_id === ROLE.PATIENT) active = 1;
  else if (req.query.is_active !== undefined) { active = strictInteger(req.query.is_active); if (active !== 0 && active !== 1) reject('2003'); }
  const rows = [...db.form_templates.values()].filter((t) => active === undefined || t.is_active === active)
    .sort((a, b) => b.created_at.localeCompare(a.created_at) || a.code_template.localeCompare(b.code_template));
  return ok(rows.slice(offset, offset + limit), rows.length);
}
const templateKeys = ['name', 'description', 'version', 'is_active'];
function create(req: MockRequest) {
  designer(req); const body = readBody(req);
  const code = identifier(text(body, 'code_template'), 255);
  if (['all', 'sections', 'questions'].includes(code.toLowerCase())) reject('2003');
  const name = text(body, 'name'); const description = nullableText(body.description, null);
  const version = text(body, 'version', '1.0'); const is_active = flag(body.is_active, 1);
  // Codes share the public endpoint: never shadow a template used by existing medical records.
  if (db.form_templates.has(code) || db.templates.has(code)) reject('4102');
  const now = nowString();
  const row: FormTemplateRow = { code_template: code, name, description, version, is_active, created_at: now, updated_at: now };
  db.form_templates.set(code, row); return ok(row);
}
function update(req: MockRequest) {
  designer(req); const row = templateById(req.params.id); const body = readBody(req);
  if (body.code_template !== undefined) reject('2003');
  requireAny(body, templateKeys);
  const patch = { name: text(body, 'name', row.name), description: nullableText(body.description, row.description), version: text(body, 'version', row.version), is_active: flag(body.is_active, row.is_active) };
  Object.assign(row, patch); touch(row.code_template); return ok(row);
}
function compactQuestionOrders(sectionId: number) {
  [...db.questions.values()].filter((q) => q.section_id === sectionId).sort((a, b) => a.order - b.order).forEach((q, index) => { q.order = index + 1; });
}
function compactSectionOrders(templateId: string) {
  [...db.template_sections.values()].filter((s) => s.template_id === templateId).sort((a, b) => a.order - b.order).forEach((s, index) => { s.order = index + 1; });
}
function cascadeQuestions(ids: Set<string>) {
  let changed = true;
  while (changed) {
    changed = false;
    for (const q of db.questions.values()) if (q.parent_question_id && ids.has(q.parent_question_id) && !ids.has(q.question_id)) { ids.add(q.question_id); changed = true; }
  }
  const affectedTemplates = new Set(
    [...ids]
      .map((id) => db.questions.get(id)?.section_id)
      .map((sectionId) => (sectionId === undefined ? undefined : db.template_sections.get(sectionId)?.template_id))
      .filter((templateId): templateId is string => Boolean(templateId)),
  );
  for (const id of ids) db.questions.delete(id);
  for (const [id, row] of db.question_options) if (ids.has(row.question_id)) db.question_options.delete(id);
  for (const q of db.questions.values()) {
    const templateId = db.template_sections.get(q.section_id)?.template_id;
    if (!templateId || !affectedTemplates.has(templateId) || !q.condition_rules) continue;
    const remaining = q.condition_rules.rules.filter((rule) => !ids.has(rule.question_id));
    if (remaining.length !== q.condition_rules.rules.length) {
      q.condition_rules = remaining.length ? { ...q.condition_rules, rules: remaining } : null;
    }
  }
}
function deleteSectionRows(id: number) {
  const section = sectionById(id);
  cascadeQuestions(new Set([...db.questions.values()].filter((q) => q.section_id === id).map((q) => q.question_id)));
  db.template_sections.delete(id);
  compactSectionOrders(section.template_id);
}
function remove(req: MockRequest) {
  designer(req); const row = templateById(req.params.id);
  if (templateInUse(row.code_template)) reject('4105');
  for (const section of db.template_sections.values()) if (section.template_id === row.code_template) deleteSectionRows(section.section_id);
  db.form_templates.delete(row.code_template); return ok();
}
const sectionKeys = ['title', 'order', 'is_required', 'filled_by'];
function createSection(req: MockRequest) {
  designer(req); const template = templateById(req.params.template_id); const body = readBody(req);
  const fields = sectionFields(body); const section_id = nextId(db.template_sections);
  const row = { section_id, template_id: template.code_template, ...fields };
  db.template_sections.set(section_id, row); touch(template.code_template); return ok(row);
}
function updateSection(req: MockRequest) {
  designer(req); const row = sectionById(positiveId(req)); const body = readBody(req);
  if (body.template_id !== undefined || body.section_id !== undefined) reject('2003');
  requireAny(body, sectionKeys); const fields = sectionFields(body, row);
  Object.assign(row, fields); touch(row.template_id); return ok(row);
}
function removeSection(req: MockRequest) {
  designer(req); const row = sectionById(positiveId(req));
  if (templateInUse(row.template_id)) reject('4105');
  deleteSectionRows(row.section_id); touch(row.template_id); return ok();
}
const questionKeys = ['question_text', 'type_question', 'placeholder', 'help_text', 'order', 'is_required', 'allow_image', 'parent_question_id', 'show_if_answer', 'condition_rules', 'options'];
function writeQuestion(req: MockRequest, editing: boolean) {
  designer(req);
  const old = editing ? questionById(req.params.id) : undefined;
  const section = sectionById(old?.section_id ?? positiveId(req, 'section_id'));
  const body = readBody(req);
  if (editing) { if (body.question_id !== undefined || body.section_id !== undefined) reject('2003'); requireAny(body, questionKeys); }
  const row = questionFields(body, section.section_id, old);
  const options = questionOptions(body, row, old);
  if (old && templateInUse(section.template_id) && (old.type_question !== row.type_question || optionsFor(old.question_id).some((o) => !options.some((n) => n.id === o.id)))) reject('4105');
  validateRelations(row, options, section.template_id, editing);
  // Commit only after every field, relation and option has been validated (atomic upsert).
  db.questions.set(row.question_id, row);
  for (const [id, option] of db.question_options) if (option.question_id === row.question_id) db.question_options.delete(id);
  options.forEach((option) => db.question_options.set(option.id, option));
  touch(section.template_id); return ok(questionResult(row));
}
function removeQuestion(req: MockRequest) {
  designer(req); const row = questionById(req.params.id); const section = sectionById(row.section_id);
  if (templateInUse(section.template_id)) reject('4105');
  cascadeQuestions(new Set([row.question_id])); compactQuestionOrders(section.section_id); touch(section.template_id); return ok();
}
export const templateRoutes: RouteDef[] = [
  ['POST', '/templates', create], ['GET', '/templates/all', list],
  ['PUT', '/templates/sections/:id', updateSection], ['DELETE', '/templates/sections/:id', removeSection],
  ['POST', '/templates/sections/:section_id/questions', (req) => writeQuestion(req, false)],
  ['PUT', '/templates/questions/:id', (req) => writeQuestion(req, true)], ['DELETE', '/templates/questions/:id', removeQuestion],
  ['POST', '/templates/:template_id/sections', createSection],
  ['GET', '/templates/:id', detail], ['PUT', '/templates/:id', update], ['DELETE', '/templates/:id', remove],
];
