import type { ClinicalTemplate } from '@/shared/types/clinical-form';

import type { Flag, FormConditions, FormShowIf } from './form-types';
import { db } from './store';

const LEGACY_STAMP = '2026-10-01 08:00:00';

function normalizeShowIf(raw: unknown): FormShowIf | null {
  let value = raw;
  if (typeof value === 'string') {
    try {
      value = JSON.parse(value);
    } catch {
      return null;
    }
  }
  if (Array.isArray(value)) return { option_values: value.map(String) };
  if (value && typeof value === 'object' && 'option_values' in value && Array.isArray((value as { option_values?: unknown }).option_values)) {
    return { option_values: (value as { option_values: unknown[] }).option_values.map(String) };
  }
  return null;
}

function normalizeConditions(raw: unknown): FormConditions | null {
  let value = raw;
  if (typeof value === 'string') {
    try {
      value = JSON.parse(value);
    } catch {
      return null;
    }
  }
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  const candidate = value as { logic?: unknown; rules?: unknown };
  if ((candidate.logic !== 'AND' && candidate.logic !== 'OR') || !Array.isArray(candidate.rules)) return null;
  return candidate as FormConditions;
}

const asFlag = (value: unknown): Flag => (value === true || value === 1 || value === '1' ? 1 : 0);

/** Build the builder's normalized rows into tmpl03; also adapt legacy clinical fixtures when read by builder detail. */
export function readBuilderTemplate(code: string) {
  const template = db.form_templates.get(code);
  if (template) {
    const sections = [...db.template_sections.values()]
      .filter((section) => section.template_id === code)
      .sort((a, b) => a.order - b.order)
      .map(({ template_id: _templateId, ...section }) => ({
        ...section,
        questions: [...db.questions.values()]
          .filter((question) => question.section_id === section.section_id)
          .sort((a, b) => a.order - b.order)
          .map(({ section_id: _sectionId, ...question }) => ({
            ...question,
            options: [...db.question_options.values()]
              .filter((option) => option.question_id === question.question_id)
              .sort((a, b) => a.order - b.order)
              .map(({ question_id: _questionId, ...option }) => option),
          })),
      }));
    return { ...template, sections };
  }

  const clinical = db.templates.get(code);
  if (!clinical) return undefined;
  return {
    code_template: clinical.code_template,
    name: clinical.name,
    description: null,
    version: '1.0',
    is_active: 1 as Flag,
    created_at: LEGACY_STAMP,
    updated_at: LEGACY_STAMP,
    sections: clinical.sections.map((section, sIndex) => ({
      section_id: /^\d+$/.test(section.section_id) ? Number(section.section_id) : sIndex + 1,
      title: section.title,
      order: Number(section.order ?? sIndex + 1),
      is_required: 0 as Flag,
      filled_by: (section.filled_by === 'both' ? 'patdoc' : section.filled_by ?? 'patient') as 'patient' | 'doctor' | 'patdoc',
      questions: section.questions.map((question, qIndex) => ({
        question_id: question.question_id,
        parent_question_id: question.parent_question_id ?? null,
        question_text: question.question_text,
        type_question: question.type_question as 'text' | 'number' | 'date' | 'radio' | 'checkbox' | 'image_upload',
        placeholder: question.placeholder ?? null,
        help_text: question.help_text ?? null,
        order: Number(question.order ?? qIndex + 1),
        is_required: asFlag(question.is_required),
        allow_image: asFlag(question.allow_image),
        show_if_answer: normalizeShowIf(question.show_if_answer),
        condition_rules: normalizeConditions(question.condition_rules),
        options: (question.options ?? []).map((option, oIndex) => ({
          id: Number(option.id),
          option_text: option.option_text,
          option_value: option.option_value,
          order: Number(option.order ?? oIndex + 1),
          trigger_image_upload: asFlag(option.trigger_image_upload),
        })),
      })),
    })),
  };
}

/** Existing records retain their exact template shape/IDs. New builder templates share the read contract. */
export function readClinicalTemplate(code: string): ClinicalTemplate | undefined {
  const existing = db.templates.get(code);
  if (existing) return existing;
  const builder = readBuilderTemplate(code);
  if (!builder) return undefined;
  // The clinical module's internal Section type uses string IDs; REST builder IDs stay numeric.
  return {
    ...builder,
    sections: builder.sections.map((section) => ({
      ...section,
      section_id: String(section.section_id),
      questions: section.questions.map((question) => ({
        ...question,
        placeholder: question.placeholder ?? undefined,
        help_text: question.help_text ?? undefined,
      })),
    })),
  };
}

export function templateInUse(code: string) {
  return [...db.medical_records.values()].some((record) => record.template_id === code);
}
