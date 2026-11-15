import type { ClinicalTemplate, FormQuestion, AnswerInput } from '@/shared/types/clinical-form';
import type { MedicalRecordStatus } from '@/shared/types';
export type MedicalRecordRow = {
  medical_record_id: number;
  patient_id: number;
  assigned_doctor_id: number | null;
  created_by: number;
  template_id: string;
  status: MedicalRecordStatus;
  instructions: string | null;
  created_at: string;
  updated_at: string;
  completed_at: string | null;
};
export type AnswerRow = AnswerInput & {
  id: number;
  medical_record_id: number;
  answered_by: number;
  created_at: string;
  updated_at: string;
};
export function createClinicalSeed() {
  const classificationQuestions: FormQuestion[] = [
    {
      question_id: 'Q_DURATION',
      question_text: 'Triệu chứng đã kéo dài bao lâu?',
      type_question: 'radio',
      is_required: true,
      options: [
        { id: 901, option_text: 'Dưới 6 tuần', option_value: 'acute' },
        { id: 902, option_text: 'Từ 6 tuần trở lên', option_value: 'chronic' },
      ],
    },
  ];
  // Chỉ là fixture kiểm thử, không thay cho bộ câu hỏi chuyên môn của backend.
  const makeTemplate = (code: string, name: string): ClinicalTemplate => ({
    code_template: code,
    name,
    sections: [
      {
        section_id: code + '_patient',
        title: 'Thông tin bệnh nhân khai báo',
        filled_by: 'patient',
        order: 1,
        questions: [
          {
            question_id: 'Q_REASON',
            question_text: 'Lý do đến khám',
            type_question: 'text',
            is_required: '1',
            order: 1,
          },
          { question_id: 'Q_ITCH', question_text: 'Mức độ ngứa (0–10)', type_question: 'number', order: 2 },
          {
            question_id: 'Q_TRIGGER',
            question_text: 'Yếu tố liên quan',
            type_question: 'checkbox',
            order: 3,
            options: [
              { id: 101, option_text: 'Thức ăn', option_value: 'food' },
              { id: 102, option_text: 'Vận động', option_value: 'exercise' },
            ],
          },
          {
            question_id: 'Q_FOOD',
            question_text: 'Loại thức ăn nghi ngờ',
            type_question: 'text',
            order: 4,
            parent_question_id: 'Q_TRIGGER',
            show_if_answer: '["food"]',
            is_required: '1',
          },
        ],
      },
      {
        section_id: code + '_doctor',
        title: 'Đánh giá của bác sĩ',
        filled_by: 'doctor',
        order: 2,
        questions: [
          { question_id: 'Q_ASSESSMENT', question_text: 'Nhận xét lâm sàng', type_question: 'text', order: 1 },
          {
            question_id: 'Q_REVIEW',
            question_text: 'Cần tái khám?',
            type_question: 'radio',
            order: 2,
            options: [
              { id: 103, option_text: 'Có', option_value: 'yes' },
              { id: 104, option_text: 'Không', option_value: 'no' },
            ],
          },
        ],
      },
    ],
  });
  const templates = new Map<string, ClinicalTemplate>([
    ['TMPL_URT_ACUTE', makeTemplate('TMPL_URT_ACUTE', 'Phiếu khám mề đay cấp tính (mẫu thử)')],
    ['TMPL_URT_CHRONIC', makeTemplate('TMPL_URT_CHRONIC', 'Phiếu khám mề đay mạn tính (mẫu thử)')],
  ]);
  const medical_records = new Map<number, MedicalRecordRow>();
  const answers = new Map<number, AnswerRow>();
  for (let i = 1; i <= 28; i++) {
    const status = i % 3 === 0 ? 'completed' : i % 3 === 1 ? 'pending' : 'in_progress';
    const stamp = `2026-10-${String(1 + (i % 28)).padStart(2, '0')} 09:00:00`;
    medical_records.set(i, {
      medical_record_id: i,
      patient_id: i <= 5 ? 15 : 17 + (i % 24),
      assigned_doctor_id: status === 'pending' ? null : i % 2 ? 2 : 3,
      created_by: 15,
      template_id: 'TMPL_URT_CHRONIC',
      status,
      instructions: status === 'completed' ? 'Tái khám theo hẹn.' : null,
      created_at: stamp,
      updated_at: stamp,
      completed_at: status === 'completed' ? stamp : null,
    });
    answers.set(i, {
      id: i,
      medical_record_id: i,
      question_id: 'Q_REASON',
      answer_text: 'Nổi mẩn ngứa tái diễn (dữ liệu thử)',
      answer_value: null,
      question_option_id: null,
      answered_by: medical_records.get(i)!.patient_id,
      created_at: stamp,
      updated_at: stamp,
    });
  }
  return { medical_records, answers, templates, classificationQuestions };
}
