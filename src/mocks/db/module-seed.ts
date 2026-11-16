import { MODULE_MOCK_SCENARIOS } from '../config';
import type { DeviceTokenRow, FormOptionRow, FormQuestionRow, FormSectionRow, FormTemplateRow, NotificationRow } from './form-types';

const stamp = { created_at: '2026-11-06 09:00:00', updated_at: '2026-11-06 09:00:00' };
export function createModuleSeed() {
  const form_templates = new Map<string, FormTemplateRow>();
  const template_sections = new Map<number, FormSectionRow>();
  const questions = new Map<string, FormQuestionRow>();
  const question_options = new Map<number, FormOptionRow>();
  let optionId = 0;
  for (const [code, name, sectionId, prefix] of [
    ['TMPL_DEMO', 'Phiếu khám mề đay — mẫu thử', 11, 'Q'],
    ['TMPL_USED', 'Mẫu đã dùng — kiểm tra bảo vệ bệnh án', 21, 'USED'],
  ] as const) {
    form_templates.set(code, { code_template: code, name, description: 'Dữ liệu minh họa để kiểm tra thiết kế và xem thử; không phải tư vấn y tế.', version: '1.0', is_active: 1, ...stamp });
    template_sections.set(sectionId, { section_id: sectionId, template_id: code, title: 'Triệu chứng hiện tại', order: 1, is_required: 1, filled_by: 'patient' });
    template_sections.set(sectionId + 1, { section_id: sectionId + 1, template_id: code, title: 'Đánh giá của bác sĩ', order: 2, is_required: 0, filled_by: 'doctor' });
    const add = (suffix: string, patch: Partial<FormQuestionRow>, options: [string, string, 0 | 1][] = []) => {
      const id = `${prefix}_${suffix}`;
      questions.set(id, { question_id: id, section_id: sectionId, parent_question_id: null, question_text: suffix, type_question: 'text',
        placeholder: null, help_text: null, order: questions.size + 1, is_required: 0, allow_image: 0, show_if_answer: null, condition_rules: null, ...patch });
      options.forEach(([option_text, option_value, trigger_image_upload], i) => {
        optionId++;
        question_options.set(optionId, { id: optionId, question_id: id, option_text, option_value, order: i + 1, trigger_image_upload });
      });
    };
    add('ITCH', { question_text: 'Bạn có bị ngứa không?', type_question: 'radio', order: 1, is_required: 1 }, [['Có', 'YES', 0], ['Không', 'NO', 0]]);
    add('LEVEL', { question_text: 'Mức độ ngứa', type_question: 'number', order: 2, is_required: 1, parent_question_id: `${prefix}_ITCH`, show_if_answer: { option_values: ['YES'] }, placeholder: 'Nhập mức độ', help_text: 'Nhập mức độ ngứa bạn cảm nhận.' });
    add('SLEEP', { question_text: 'Cơn ngứa ảnh hưởng giấc ngủ?', type_question: 'text', order: 3, parent_question_id: `${prefix}_LEVEL`, condition_rules: { logic: 'AND', rules: [{ question_id: `${prefix}_LEVEL`, operator: 'gte', value: 7 }] } });
    add('DATE', { question_text: 'Ngày xuất hiện triệu chứng', type_question: 'date', order: 4 });
    add('TRIGGERS', { question_text: 'Yếu tố liên quan', type_question: 'checkbox', order: 5, allow_image: 1 }, [['Thức ăn', 'FOOD', 0], ['Tổn thương da (cần ảnh)', 'SKIN', 1]]);
    add('PHOTO', { question_text: 'Ảnh tổn thương xem thử', type_question: 'image_upload', order: 6 });
    add('NOTE', { question_text: 'Nhận xét lâm sàng', section_id: sectionId + 1, type_question: 'text', order: 1 });
  }
  for (let i = 1; i <= 24; i++) {
    const code = `TMPL_SAMPLE_${String(i).padStart(2, '0')}`;
    form_templates.set(code, { code_template: code, name: `Mẫu phân trang ${i}`, description: null, version: '1.0', is_active: i % 2 ? 1 : 0, created_at: `2026-10-${String(i).padStart(2, '0')} 08:00:00`, updated_at: '2026-11-01 08:00:00' });
  }
  const notifications = new Map<number, NotificationRow>();
  const types = ['general', 'prescription', 'lab_result', 'appointment'] as const;
  const titles = ['Nhắc theo dõi triệu chứng', 'Bạn có đơn thuốc mới', 'Đã có kết quả xét nghiệm', 'Nhắc lịch tái khám'];
  for (const userId of [15, 2, 3]) for (let i = 0; i < 25; i++) {
    const id = notifications.size + 1; const type = types[i % types.length];
    notifications.set(id, { id, user_id: userId, title: `${titles[i % titles.length]} · ${i + 1}`,
      body: 'Đây là thông báo minh họa. Bạn có thể xem lại nội dung này trong hộp thư của mình.',
      type, avatar: null, reference_id: type === 'general' || type === 'appointment' ? null : 70 + i,
      is_read: i % 3 === 0 ? 1 : 0, created_at: `2026-11-${String(6 - Math.floor(i / 5)).padStart(2, '0')} 10:${String(59 - i).padStart(2, '0')}:00`, updated_at: stamp.updated_at });
  }
  if (MODULE_MOCK_SCENARIOS.emptyNotifications) notifications.clear();
  if (MODULE_MOCK_SCENARIOS.emptyTemplates) { form_templates.clear(); template_sections.clear(); questions.clear(); question_options.clear(); }
  return { form_templates, template_sections, questions, question_options, notifications, user_fcm_tokens: new Map<number, DeviceTokenRow>(), used_template_codes: new Set(['TMPL_USED']) };
}
