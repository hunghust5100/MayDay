import { api, ApiError } from '@/core/api';

import type {
  CreateQuestionRequest,
  CreateSectionRequest,
  CreateTemplateRequest,
  QuestionResult,
  SectionResult,
  TemplateDetail,
  TemplateFilters,
  TemplateSummary,
  UpdateQuestionRequest,
  UpdateSectionRequest,
  UpdateTemplateRequest,
} from '../types';

const segment = encodeURIComponent;
type Empty = Record<string, never>;

export const templatesApi = {
  list: ({ signal, ...query }: TemplateFilters & { page: number; limit: number; signal?: AbortSignal }) =>
    api.getPage<TemplateSummary>('/templates/all', { query, signal }),
  getDetail: async (id: string, signal?: AbortSignal) => {
    const template = await api.get<TemplateDetail>(`/templates/${segment(id)}`, { signal });
    // The shared read endpoint also serves legacy clinical fixtures. They are not editable builder DTOs.
    if (!template || typeof template.version !== 'string' || !Array.isArray(template.sections) ||
      template.sections.some((section) => typeof section.section_id !== 'number' || !Array.isArray(section.questions) ||
        section.questions.some((question) => !Array.isArray(question.options)))) {
      throw new ApiError('BAD_RESPONSE', { serverMessage: 'Template does not support the builder contract' });
    }
    return template;
  },
  createTemplate: (body: CreateTemplateRequest) => api.post<TemplateSummary>('/templates', body),
  updateTemplate: (id: string, body: UpdateTemplateRequest) => api.put<TemplateSummary>(`/templates/${segment(id)}`, body),
  deleteTemplate: (id: string) => api.delete<Empty>(`/templates/${segment(id)}`),
  createSection: (templateId: string, body: CreateSectionRequest) =>
    api.post<SectionResult>(`/templates/${segment(templateId)}/sections`, body),
  updateSection: (id: number, body: UpdateSectionRequest) => api.put<SectionResult>(`/templates/sections/${id}`, body),
  deleteSection: (id: number) => api.delete<Empty>(`/templates/sections/${id}`),
  createQuestion: (sectionId: number, body: CreateQuestionRequest) =>
    api.post<QuestionResult>(`/templates/sections/${sectionId}/questions`, body),
  updateQuestion: (id: string, body: UpdateQuestionRequest) =>
    api.put<QuestionResult>(`/templates/questions/${segment(id)}`, body),
  deleteQuestion: (id: string) => api.delete<Empty>(`/templates/questions/${segment(id)}`),
};
