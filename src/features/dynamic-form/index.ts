// Public API: feature mẫu phiếu khám động
export { templatesApi } from './api/templates-api';
export { TemplateDetailScreen } from './screens/TemplateDetailScreen';
export { TemplateFormScreen } from './screens/TemplateFormScreen';
export { TemplatesScreen } from './screens/TemplatesScreen';
export { useTemplate } from './hooks/useTemplate';
export { useBuilderTemplate } from './hooks/useTemplates';
export { ClinicalForm } from './components/ClinicalForm';
export { canFill, questionVisible, serializeAnswers, validateForm } from './utils/form';
export type { ClinicalTemplate, FormActor, FormValues, FormQuestion, AnswerInput } from '@/shared/types/clinical-form';
export * from './types';
