// Public API: feature mẫu phiếu khám động
export { TemplatesScreen } from './screens/TemplatesScreen';
export { useTemplate } from './hooks/useTemplate';
export { ClinicalForm } from './components/ClinicalForm';
export { canFill, serializeAnswers, validateForm } from './utils/form';
export type { ClinicalTemplate, FormActor, FormValues, FormQuestion, AnswerInput } from '@/shared/types/clinical-form';
