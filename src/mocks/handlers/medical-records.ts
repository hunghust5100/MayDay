import { MEDICAL_RECORD_STATUS } from '@/shared/constants';
import type { AnswerInput, ClinicalTemplate, FormActor, FormValues } from '@/shared/types/clinical-form';
import { canFill, validateForm } from '@/shared/utils/clinical-form';
import { deleteRecordMedia } from '../core/media-access';
import { removeDiacritics } from '@/shared/utils';
import { ROLE } from '../config';
import { authenticate, requireAdmin } from '../core/auth';
import { created, ok, reject, type MockRequest } from '../core/http';
import type { RouteDef } from '../core/router';
import {
  checkDate,
  checkGender,
  checkPassword,
  checkPhone,
  checkYearOfBirth,
  optInt,
  optString,
  paramInt,
  queryInt,
  readBody,
  readPaging,
  reqInt,
  reqString,
  requireFields,
} from '../core/validate';
import {
  db,
  emptyPatient,
  findUserByPhone,
  insertUser,
  nextId,
  nowString,
  toPatientProfile,
  type UserRow,
} from '../db/store';
import type { MedicalRecordRow } from '../db/clinical';
import { readClinicalTemplate } from '../db/template-reader';

function requirePermission(req: MockRequest, name: string) {
  const { user } = authenticate(req);
  const permission = [...db.permissions.values()].find((p) => p.name === name);
  if (!permission || !db.role_permissions.some((p) => p.role_id === user.role_id && p.permission_id === permission.id))
    reject('3103');
  return user;
}
function readRecord(req: MockRequest) {
  const { user } = authenticate(req);
  const record = db.medical_records.get(paramInt(req, 'id'));
  if (!record) reject('4001', 'Medical record not found');
  if (user.role_id === ROLE.PATIENT) {
    if (record.patient_id !== user.user_id) reject('3106');
  } else requirePermission(req, 'view_medical_records');
  return { record, user };
}
function ensureWritable(record: MedicalRecordRow, user: UserRow) {
  if (record.status === 'completed' || record.status === 'cancelled')
    reject('4003', 'Medical record already completed');
  if (user.role_id === ROLE.PATIENT) {
    if (record.status !== 'pending') reject('3101');
  } else {
    const permission = [...db.permissions.values()].find((p) => p.name === 'edit_medical_records');
    if (!db.role_permissions.some((p) => p.role_id === user.role_id && p.permission_id === permission?.id))
      reject('3103');
    if (record.assigned_doctor_id !== user.user_id) reject('3105', 'Doctor not assigned to this record');
    if (record.status !== 'in_progress') reject('4004');
  }
}
function templateOf(id: string) {
  const template = readClinicalTemplate(id);
  if (!template) reject('4101', 'Template not found');
  return template;
}
function validateAnswers(raw: unknown, template: ClinicalTemplate, actor: FormActor): AnswerInput[] {
  if (!Array.isArray(raw)) reject('2002');
  const ids = new Set<string>();
  return raw.map((value: unknown) => {
    if (!value || typeof value !== 'object' || Array.isArray(value)) reject('2002');
    const body = value as Record<string, unknown>;
    const question_id = reqString(body, 'question_id');
    if (ids.has(question_id)) reject('2003');
    ids.add(question_id);
    const section = template.sections.find((s) => s.questions.some((q) => q.question_id === question_id));
    const q = section?.questions.find((q) => q.question_id === question_id);
    if (!q || !section) reject('4008', 'Question does not belong to template');
    if (!canFill(section.filled_by, actor)) reject('3101');
    const option = optInt(body, 'question_option_id');
    const text = optString(body, 'answer_text');
    if (option != null && !q.options?.some((o) => Number(o.id) === option)) reject('2003');
    if (body.answer_value != null && (typeof body.answer_value !== 'object' || Array.isArray(body.answer_value)))
      reject('2002');
    return {
      question_id,
      question_option_id: option ?? null,
      answer_text: text ?? null,
      answer_value: (body.answer_value as Record<string, unknown> | null) ?? null,
    };
  });
}
function formValues(answers: AnswerInput[], template: ClinicalTemplate): FormValues {
  const values: FormValues = {};
  for (const a of answers) {
    const q = template.sections.flatMap((s) => s.questions).find((q) => q.question_id === a.question_id);
    const raw = a.answer_value?.value;
    values[a.question_id] =
      a.answer_text ??
      (typeof raw === 'number' ||
      typeof raw === 'string' ||
      (Array.isArray(raw) && raw.every((v) => typeof v === 'string'))
        ? raw
        : (q?.options?.find((o) => Number(o.id) === a.question_option_id)?.option_value ?? null));
  }
  return values;
}
function persistAnswers(recordId: number, answers: AnswerInput[], userId: number) {
  for (const input of answers) {
    const old = [...db.answers.values()].find(
      (a) => a.medical_record_id === recordId && a.question_id === input.question_id,
    );
    const id = old?.id ?? nextId(db.answers);
    db.answers.set(id, {
      ...input,
      id,
      medical_record_id: recordId,
      answered_by: userId,
      created_at: old?.created_at ?? nowString(),
      updated_at: nowString(),
    });
  }
}
function listRecords(req: MockRequest, patientId?: number) {
  const { user } = authenticate(req);
  if (patientId !== undefined && user.role_id === ROLE.PATIENT) {
    if (patientId !== user.user_id) reject('3106');
  } else requirePermission(req, 'view_medical_records');
  const status = req.query.status;
  if (status && !(status in MEDICAL_RECORD_STATUS)) reject('4009');
  const patient = patientId ?? queryInt(req, 'patient_id');
  const rows = [...db.medical_records.values()]
    .filter((r) => (patient === undefined || r.patient_id === patient) && (!status || r.status === status))
    .sort((a, b) => b.created_at.localeCompare(a.created_at) || b.medical_record_id - a.medical_record_id);
  const { offset, limit } = readPaging(req);
  return ok(rows.slice(offset, offset + limit), rows.length);
}
function searchPatients(req: MockRequest) {
  requirePermission(req, 'view_medical_records');
  checkGender(req.query.gender);
  const min = queryInt(req, 'min_year') || undefined;
  const max = queryInt(req, 'max_year') || undefined;
  checkYearOfBirth(min);
  checkYearOfBirth(max);
  if (min && max && min > max) reject('2003');
  const low = min ?? max;
  const high = max ?? min;
  const keyword = removeDiacritics((req.query.keyword ?? '').trim()).toLowerCase();
  const rows = [...db.users.values()]
    .filter((u) => db.patients.has(u.user_id))
    .map(toPatientProfile)
    .filter(
      (p) =>
        (!keyword || removeDiacritics(p.full_name).toLowerCase().includes(keyword) || p.phone.includes(keyword)) &&
        (!req.query.gender || p.gender === req.query.gender) &&
        (low === undefined || (p.year_of_birth != null && p.year_of_birth >= low)) &&
        (high === undefined || (p.year_of_birth != null && p.year_of_birth <= high)),
    )
    .sort((a, b) => b.user_id - a.user_id);
  const { offset, limit } = readPaging(req);
  return ok(rows.slice(offset, offset + limit), rows.length);
}
function createPatient(req: MockRequest) {
  requirePermission(req, 'create_patients');
  const body = readBody(req);
  requireFields(body, ['full_name', 'phone', 'password']);
  const full_name = reqString(body, 'full_name').trim();
  const phone = reqString(body, 'phone').trim();
  const password = reqString(body, 'password');
  checkPhone(phone);
  checkPassword(password);
  if (findUserByPhone(phone)) reject('3006');
  const gender = optString(body, 'gender');
  checkGender(gender);
  const year = optInt(body, 'year_of_birth');
  checkYearOfBirth(year);
  const optional = Object.fromEntries(
    [
      'career',
      'ethnic',
      'hamlet_address',
      'commune_address',
      'city_address',
      'work_place',
      'health_insurance_number',
      'health_insurance_validate',
      'next_of_kin_name',
      'next_of_kin_phone',
    ].map((key) => [key, optString(body, key)?.trim() || null]),
  );
  checkDate(optional.health_insurance_validate);
  if (optional.next_of_kin_phone) checkPhone(optional.next_of_kin_phone);
  const user = insertUser({ full_name, phone, password, gender, role_id: ROLE.PATIENT });
  db.patients.set(user.user_id, emptyPatient(user.user_id, { ...optional, year_of_birth: year ?? null }));
  return created(toPatientProfile(user));
}

export const medicalRoutes: RouteDef[] = [
  ['GET', '/doctor/patients/search', searchPatients],
  ['POST', '/doctor/patients', createPatient],
  ['POST', '/doctor/patients/create', createPatient],
  [
    'GET',
    '/templates/:id',
    (req) => {
      authenticate(req);
      return ok(templateOf(req.params.id));
    },
  ],
  [
    'GET',
    '/medical_records/classify-questions',
    (req) => {
      authenticate(req);
      return ok(db.classificationQuestions);
    },
  ],
  [
    'POST',
    '/medical_records/classify',
    (req) => {
      authenticate(req);
      const body = readBody(req);
      if (!Array.isArray(body.answers)) reject('4006');
      const answers = body.answers as Record<string, unknown>[];
      if (
        answers.some(
          (a) =>
            !a ||
            typeof a !== 'object' ||
            !db.classificationQuestions.some(
              (q) => q.question_id === a.question_id && q.options?.some((o) => o.option_value === a.option_value),
            ),
        )
      )
        reject('4006');
      if (db.classificationQuestions.some((q) => !answers.some((a) => a.question_id === q.question_id))) reject('4006');
      const template = templateOf(
        answers.some((a) => a.option_value === 'acute') ? 'TMPL_URT_ACUTE' : 'TMPL_URT_CHRONIC',
      );
      return ok({ template_id: template.code_template, template_name: template.name });
    },
  ],
  [
    'POST',
    '/medical_records',
    (req) => {
      const { user } = authenticate(req);
      const body = readBody(req);
      const patient = user.role_id === ROLE.PATIENT;
      if (!patient) requirePermission(req, 'create_patients');
      const patientId = patient ? user.user_id : reqInt(body, 'patient_id');
      if (!db.patients.has(patientId)) reject('2003');
      const template = templateOf(reqString(body, 'template_id'));
      // Builder-owned templates can be retired; existing records remain readable.
      if (db.form_templates.get(template.code_template)?.is_active === 0) reject('4101');
      const answers = validateAnswers(body.answers ?? [], template, patient ? 'patient' : 'doctor');
      const now = nowString();
      const id = nextId(db.medical_records);
      const record: MedicalRecordRow = {
        medical_record_id: id,
        patient_id: patientId,
        assigned_doctor_id: null,
        created_by: user.user_id,
        template_id: template.code_template,
        status: 'pending',
        instructions: null,
        created_at: now,
        updated_at: now,
        completed_at: null,
      };
      db.medical_records.set(id, record);
      persistAnswers(id, answers, user.user_id);
      return created(record);
    },
  ],
  ['GET', '/medical_records/all', (req) => listRecords(req)],
  ['GET', '/medical_records/patients/:id/history', (req) => listRecords(req, paramInt(req, 'id'))],
  [
    'GET',
    '/medical_records/:id/summary',
    (req) => {
      const { record } = readRecord(req);
      return ok({
        medical_record_id: record.medical_record_id,
        status: record.status,
        created_at: record.created_at,
        patient_name: db.users.get(record.patient_id)?.full_name ?? '',
      });
    },
  ],
  [
    'GET',
    '/medical_records/:id/answers',
    (req) => {
      const { record } = readRecord(req);
      return ok([...db.answers.values()].filter((a) => a.medical_record_id === record.medical_record_id));
    },
  ],
  [
    'PUT',
    '/medical_records/:id/answers',
    (req) => {
      const { record, user } = readRecord(req);
      ensureWritable(record, user);
      const raw = readBody(req).answers;
      if (Array.isArray(raw) && !raw.length) reject('4007', 'Answers required');
      const template = templateOf(record.template_id);
      const actor = user.role_id === ROLE.PATIENT ? 'patient' : 'doctor';
      const answers = validateAnswers(raw, template, actor);
      // Đối chiếu cả câu trả lời cũ; các section của vai trò khác được giữ nguyên.
      const merged = new Map(
        [...db.answers.values()]
          .filter((a) => a.medical_record_id === record.medical_record_id)
          .map((a) => [a.question_id, a as AnswerInput]),
      );
      answers.forEach((a) => merged.set(a.question_id, a));
      // Answer rows must exist before images can be linked; enforce image requirements when completing.
      if (
        Object.keys(
          validateForm(template, formValues([...merged.values()], template), actor, {
            images: {},
            deferImageRequirements: true,
          }),
        ).length
      )
        reject('2003');
      persistAnswers(record.medical_record_id, answers, user.user_id);
      return ok({ count: answers.length });
    },
  ],
  [
    'POST',
    '/medical_records/:id/accept',
    (req) => {
      const user = requirePermission(req, 'edit_medical_records');
      const { record } = readRecord(req);
      if (record.status === 'in_progress' && record.assigned_doctor_id !== user.user_id)
        reject('4005', 'Already accepted by another doctor');
      if (record.status !== 'pending') reject('4004', 'Medical record not in pending status');
      record.assigned_doctor_id = user.user_id;
      record.status = 'in_progress';
      record.updated_at = nowString();
      return ok(record);
    },
  ],
  [
    'PUT',
    '/medical_records/:id',
    (req) => {
      const user = requirePermission(req, 'edit_medical_records');
      const { record } = readRecord(req);
      ensureWritable(record, user);
      const body = readBody(req);
      const status = reqString(body, 'status');
      if (status !== 'completed' && status !== 'cancelled') reject('4009');
      if (status === 'completed') {
        const template = templateOf(record.template_id);
        const answers = [...db.answers.values()].filter(
          (a) => a.medical_record_id === record.medical_record_id,
        );
        const images = Object.fromEntries(
          answers.map((a) => [
            a.question_id,
            [...db.answer_images.values()]
              .filter((link) => link.answer_id === a.id)
              .map((link) => ({
                attachment_id: link.attachment_id,
                file_url: db.media_attachments.get(link.attachment_id)?.file_url ?? '',
                option_value: link.option_value,
              })),
          ]),
        );
        const imageQuestions = new Set(
          template.sections
            .flatMap((s) => s.questions)
            .filter(
              (q) =>
                q.type_question === 'image_upload' ||
                q.options?.some((o) => o.trigger_image_upload === 1 || o.trigger_image_upload === '1'),
            )
            .map((q) => q.question_id),
        );
        for (const actor of ['patient', 'doctor'] as const)
          if (
            Object.keys(validateForm(template, formValues(answers, template), actor, { images })).some((id) =>
              imageQuestions.has(id),
            )
          )
            reject('6001');
      }
      record.instructions = optString(body, 'instructions') ?? record.instructions;
      record.status = status;
      record.updated_at = nowString();
      record.completed_at = status === 'completed' ? nowString() : null;
      return ok(record);
    },
  ],
  [
    'DELETE',
    '/medical_records/:id',
    (req) => {
      requireAdmin(req);
      const { record } = readRecord(req);
      deleteRecordMedia(record.medical_record_id);
      db.medical_records.delete(record.medical_record_id);
      for (const [id, answer] of db.answers)
        if (answer.medical_record_id === record.medical_record_id) db.answers.delete(id);
      return ok();
    },
  ],
  ['GET', '/medical_records/:id', (req) => ok(readRecord(req).record)],
];
