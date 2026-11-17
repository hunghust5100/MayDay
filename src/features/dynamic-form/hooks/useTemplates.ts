import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { usePaginatedQuery } from '@/core/api';

import { templatesApi } from '../api/templates-api';
import type {
  CreateQuestionRequest,
  CreateSectionRequest,
  CreateTemplateRequest,
  TemplateFilters,
  UpdateQuestionRequest,
  UpdateSectionRequest,
  UpdateTemplateRequest,
} from '../types';

export const TEMPLATES_QUERY_KEY = ['templates'] as const;

export function useTemplates(filters: TemplateFilters) {
  return usePaginatedQuery({
    queryKey: [...TEMPLATES_QUERY_KEY, 'list', filters],
    pageErrorFeedback: true,
    queryFn: ({ page, limit, signal }) => templatesApi.list({ ...filters, page, limit, signal }),
  });
}

export function useBuilderTemplate(codeTemplate: string | undefined) {
  return useQuery({
    // Builder DTO is stricter than ClinicalTemplate; do not reuse the clinical renderer's cache entry.
    queryKey: [...TEMPLATES_QUERY_KEY, 'builder-detail', codeTemplate],
    queryFn: ({ signal }) => templatesApi.getDetail(codeTemplate as string, signal),
    enabled: Boolean(codeTemplate),
  });
}

export { useBuilderTemplate as useTemplate };

function useInvalidateTemplates() {
  const queryClient = useQueryClient();
  return async () => {
    await queryClient.invalidateQueries({ queryKey: TEMPLATES_QUERY_KEY });
  };
}

export function useCreateTemplate() {
  const invalidate = useInvalidateTemplates();
  return useMutation({ mutationFn: (body: CreateTemplateRequest) => templatesApi.createTemplate(body), onSuccess: invalidate, meta: { silent: true } });
}

export function useUpdateTemplate(codeTemplate: string) {
  const invalidate = useInvalidateTemplates();
  return useMutation({
    mutationFn: (body: UpdateTemplateRequest) => templatesApi.updateTemplate(codeTemplate, body),
    onSuccess: invalidate,
    meta: { silent: true },
  });
}

export function useDeleteTemplate() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (codeTemplate: string) => templatesApi.deleteTemplate(codeTemplate),
    // Dialog giữ lỗi inline (đặc biệt 4105) và hướng dẫn ngừng hoạt động, không báo toast trùng.
    meta: { silent: true },
    onSuccess: (_data, codeTemplate) => {
      queryClient.removeQueries({ queryKey: [...TEMPLATES_QUERY_KEY, 'builder-detail', codeTemplate] });
      return queryClient.invalidateQueries({ queryKey: TEMPLATES_QUERY_KEY });
    },
  });
}

export function useCreateSection(codeTemplate: string) {
  const invalidate = useInvalidateTemplates();
  return useMutation({
    mutationFn: (body: CreateSectionRequest) => templatesApi.createSection(codeTemplate, body),
    meta: { silent: true },
    onSuccess: invalidate,
  });
}

export function useUpdateSection() {
  const invalidate = useInvalidateTemplates();
  return useMutation({ mutationFn: ({ id, body }: { id: number; body: UpdateSectionRequest }) => templatesApi.updateSection(id, body), onSuccess: invalidate, meta: { silent: true } });
}

export function useDeleteSection() {
  const invalidate = useInvalidateTemplates();
  return useMutation({ mutationFn: (id: number) => templatesApi.deleteSection(id), onSuccess: invalidate, meta: { silent: true } });
}

export function useCreateQuestion() {
  const invalidate = useInvalidateTemplates();
  return useMutation({
    mutationFn: ({ sectionId, body }: { sectionId: number; body: CreateQuestionRequest }) => templatesApi.createQuestion(sectionId, body),
    meta: { silent: true },
    onSuccess: invalidate,
  });
}

export function useUpdateQuestion() {
  const invalidate = useInvalidateTemplates();
  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: UpdateQuestionRequest }) => templatesApi.updateQuestion(id, body),
    meta: { silent: true },
    onSuccess: invalidate,
  });
}

export function useDeleteQuestion() {
  const invalidate = useInvalidateTemplates();
  return useMutation({ mutationFn: (id: string) => templatesApi.deleteQuestion(id), onSuccess: invalidate, meta: { silent: true } });
}
