import type { ClinicalTemplate, FormQuestion, AnswerInput } from '@/shared/types/clinical-form';
import type { MedicalRecordStatus } from '@/shared/types';
import { addDays, startOfDay, toApiDate } from '@/shared/utils';
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
export type Uas7ScoreRow = {
  id: number;
  patient_id: number;
  medical_record_id: number;
  score_date: string;
  iss7: number;
  hss7: number;
  daily_score: number;
  note: string | null;
  created_at: string;
  updated_at: string;
};
export type PrescriptionItemRow = {
  id: number;
  medicine_name: string;
  dosage: string | null;
  frequency: string | null;
  duration: string | null;
  instruction: string | null;
};
export type PrescriptionRow = {
  id: number;
  medical_record_id: number;
  doctor_id: number;
  doctor_name: string;
  note: string | null;
  items: PrescriptionItemRow[];
  created_at: string;
  updated_at: string;
};
export type LabResultRow = {
  id: number;
  lab_request_id: number;
  medical_record_id: number;
  doctor_id: number;
  test_name: string;
  description: string | null;
  note: string | null;
  result_value: string | null;
  reference_range: string | null;
  status: 'pending' | 'completed';
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
      template_id: i === 28 ? 'TMPL_USED' : 'TMPL_URT_CHRONIC',
      status,
      instructions: status === 'completed' ? 'Tái khám theo hẹn.' : null,
      created_at: stamp,
      updated_at: stamp,
      completed_at: status === 'completed' ? stamp : null,
    });
    answers.set(i, {
      id: i,
      medical_record_id: i,
      question_id: i === 28 ? 'USED_ITCH' : 'Q_REASON',
      answer_text: i === 28 ? null : 'Nổi mẩn ngứa tái diễn (dữ liệu thử)',
      answer_value: i === 28 ? { value: 'NO' } : null,
      question_option_id: i === 28 ? 6 : null,
      answered_by: medical_records.get(i)!.patient_id,
      created_at: stamp,
      updated_at: stamp,
    });
  }
  const uas7_scores = new Map<number, Uas7ScoreRow>();
  const today = startOfDay(new Date());
  const sampleScores: [number, number, string | null][] = [
    [2, 2, 'Ngứa nhiều vào buổi tối'],
    [2, 1, null],
    [1, 1, 'Giảm sau khi uống thuốc'],
    [2, 2, null],
    [1, 2, 'Nổi sẩn vùng cánh tay'],
    [1, 1, null],
  ];
  sampleScores.forEach(([iss7, hss7, note], idx) => {
    const id = idx + 1;
    const scoreDate = toApiDate(addDays(today, idx - 6));
    const stamp = `${scoreDate} 20:00:00`;
    uas7_scores.set(id, {
      id,
      patient_id: 15,
      medical_record_id: 5,
      score_date: scoreDate,
      iss7,
      hss7,
      daily_score: iss7 + hss7,
      note,
      created_at: stamp,
      updated_at: stamp,
    });
  });

  const prescriptions = new Map<number, PrescriptionRow>([
    [
      1,
      {
        id: 1,
        medical_record_id: 3,
        doctor_id: 3,
        doctor_name: 'Lê Văn Cường',
        note: 'Uống đều đặn, tránh thức ăn nghi ngờ gây dị ứng.',
        items: [
          {
            id: 1,
            medicine_name: 'Loratadine 10mg',
            dosage: '10mg',
            frequency: '1 viên/ngày',
            duration: '14 ngày',
            instruction: 'Uống sau bữa ăn sáng',
          },
          {
            id: 2,
            medicine_name: 'Fexofenadine 180mg',
            dosage: '180mg',
            frequency: '1 viên/tối khi ngứa nhiều',
            duration: '7 ngày',
            instruction: 'Uống với nước lọc, tránh nước ép hoa quả',
          },
        ],
        created_at: '2026-10-04 10:30:00',
        updated_at: '2026-10-04 10:30:00',
      },
    ],
  ]);

  const lab_results = new Map<number, LabResultRow>([
    [
      1,
      {
        id: 1,
        lab_request_id: 1,
        medical_record_id: 3,
        doctor_id: 3,
        test_name: 'Định lượng IgE toàn phần',
        description: 'Đánh giá cơ địa dị ứng',
        note: null,
        result_value: '185 IU/mL',
        reference_range: '< 100 IU/mL',
        status: 'completed',
        created_at: '2026-10-04 09:30:00',
        updated_at: '2026-10-04 14:00:00',
      },
    ],
    [
      2,
      {
        id: 2,
        lab_request_id: 1,
        medical_record_id: 3,
        doctor_id: 3,
        test_name: 'Công thức máu toàn bộ',
        description: 'Kiểm tra bạch cầu ái toan',
        note: null,
        result_value: 'Bạch cầu ái toan 4.2%',
        reference_range: '1% – 6%',
        status: 'completed',
        created_at: '2026-10-04 09:30:00',
        updated_at: '2026-10-04 14:00:00',
      },
    ],
    [
      3,
      {
        id: 3,
        lab_request_id: 2,
        medical_record_id: 5,
        doctor_id: 2,
        test_name: 'Test lẩy da dị nguyên (Prick test)',
        description: 'Sàng lọc dị nguyên hô hấp và thực phẩm',
        note: 'Ngưng kháng histamin trước test 5 ngày',
        result_value: null,
        reference_range: null,
        status: 'pending',
        created_at: '2026-10-06 09:30:00',
        updated_at: '2026-10-06 09:30:00',
      },
    ],
  ]);

  return { medical_records, answers, templates, classificationQuestions, uas7_scores, prescriptions, lab_results };
}
