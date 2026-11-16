import type { ClinicalTemplate } from '@/shared/types/clinical-form';

import { db } from './store';

/** Build the builder's normalized rows into tmpl03; never mutate the legacy clinical fixtures. */
export function readBuilderTemplate(code: string) {
  const template = db.form_templates.get(code);
  if (!template) return undefined;
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
  return db.used_template_codes.has(code) || [...db.medical_records.values()].some((record) => record.template_id === code);
}
