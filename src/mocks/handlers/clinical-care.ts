import { ROLE } from '../config';
import { authenticate } from '../core/auth';
import { created, ok, reject, type MockRequest } from '../core/http';
import type { RouteDef } from '../core/router';
import { checkDate, optString, paramInt, readBody } from '../core/validate';
import type { LabResultRow, PrescriptionItemRow, PrescriptionRow, Uas7ScoreRow } from '../db/clinical';
import { db, nextId, nowString } from '../db/store';

function requirePermission(req: MockRequest, name: string, code: string = '3103') {
  const { user } = authenticate(req);
  const permission = [...db.permissions.values()].find((p) => p.name === name);
  if (!permission || !db.role_permissions.some((p) => p.role_id === user.role_id && p.permission_id === permission.id)) {
    reject(code);
  }
  return user;
}

function readRecord(req: MockRequest, recordId: number) {
  const { user } = authenticate(req);
  const record = db.medical_records.get(recordId);
  if (!record) reject('4001', 'Medical record not found');
  if (user.role_id === ROLE.PATIENT) {
    if (record.patient_id !== user.user_id) reject('3106');
  } else {
    requirePermission(req, 'view_medical_records');
  }
  return { record, user };
}

function findEligibleUas7Record(patientId: number) {
  return [...db.medical_records.values()]
    .filter(
      (r) =>
        r.patient_id === patientId &&
        r.template_id === 'TMPL_URT_CHRONIC' &&
        (r.status === 'in_progress' || r.status === 'pending'),
    )
    .sort((a, b) => {
      if (a.status !== b.status) return a.status === 'in_progress' ? -1 : 1;
      return b.medical_record_id - a.medical_record_id;
    })[0];
}

function parseRecordIdFromBody(body: Record<string, unknown>): number {
  const raw = body.medical_record_id;
  if (raw === undefined || raw === null || raw === '') reject('2001');
  const num = typeof raw === 'number' ? raw : typeof raw === 'string' && /^\d+$/.test(raw) ? Number(raw) : NaN;
  if (!Number.isInteger(num) || num <= 0) reject('2002');
  return num;
}

function parseScoreValue(raw: unknown, errorCode: string): number {
  if (raw === undefined || raw === null || raw === '') reject(errorCode);
  const num = typeof raw === 'number' ? raw : typeof raw === 'string' && /^-?\d+$/.test(raw) ? Number(raw) : NaN;
  if (!Number.isInteger(num) || num < 0 || num > 3) reject(errorCode);
  return num;
}

export const clinicalCareRoutes: RouteDef[] = [
  [
    'GET',
    '/uas7-scores/eligibility',
    (req) => {
      const { user } = authenticate(req);
      if (user.role_id !== ROLE.PATIENT) reject('3104');
      const record = findEligibleUas7Record(user.user_id);
      return ok({
        eligible: Boolean(record),
        medical_record_id: record?.medical_record_id ?? null,
      });
    },
  ],
  [
    'POST',
    '/uas7-scores',
    (req) => {
      const user = requirePermission(req, 'submit_uas7', '3104');
      if (user.role_id !== ROLE.PATIENT) reject('3104');
      const body = readBody(req);
      const recordId = parseRecordIdFromBody(body);
      const record = db.medical_records.get(recordId);
      if (
        !record ||
        record.patient_id !== user.user_id ||
        record.template_id !== 'TMPL_URT_CHRONIC' ||
        (record.status !== 'in_progress' && record.status !== 'pending')
      ) {
        reject('5001');
      }
      const scoreDate = optString(body, 'score_date')?.trim();
      if (!scoreDate) reject('5005');
      checkDate(scoreDate);
      if ([...db.uas7_scores.values()].some((s) => s.patient_id === user.user_id && s.score_date === scoreDate)) {
        reject('5002');
      }
      const iss7 = parseScoreValue(body.iss7, '5003');
      const hss7 = parseScoreValue(body.hss7, '5004');
      const note = optString(body, 'note')?.trim() || null;
      const now = nowString();
      const id = nextId(db.uas7_scores);
      const row: Uas7ScoreRow = {
        id,
        patient_id: user.user_id,
        medical_record_id: record.medical_record_id,
        score_date: scoreDate,
        iss7,
        hss7,
        daily_score: iss7 + hss7,
        note,
        created_at: now,
        updated_at: now,
      };
      db.uas7_scores.set(id, row);
      return created(row);
    },
  ],
  [
    'GET',
    '/uas7-scores/patient/:id',
    (req) => {
      const { user } = authenticate(req);
      const patientId = paramInt(req, 'id');
      if (user.role_id === ROLE.PATIENT) {
        if (patientId !== user.user_id) reject('3106');
      } else {
        requirePermission(req, 'view_medical_records');
      }
      const rows = [...db.uas7_scores.values()]
        .filter((s) => s.patient_id === patientId)
        .sort((a, b) => b.score_date.localeCompare(a.score_date) || b.id - a.id);
      return ok(rows);
    },
  ],
  [
    'GET',
    '/prescriptions/:id',
    (req) => {
      const { record } = readRecord(req, paramInt(req, 'id'));
      const rows = [...db.prescriptions.values()]
        .filter((rx) => rx.medical_record_id === record.medical_record_id)
        .sort((a, b) => b.created_at.localeCompare(a.created_at) || b.id - a.id);
      return ok(rows);
    },
  ],
  [
    'POST',
    '/prescriptions',
    (req) => {
      const user = requirePermission(req, 'prescribe');
      const body = readBody(req);
      const recordId = parseRecordIdFromBody(body);
      const record = db.medical_records.get(recordId);
      if (!record) reject('4001', 'Medical record not found');
      if ([...db.prescriptions.values()].some((rx) => rx.medical_record_id === recordId)) {
        reject('8003');
      }
      if (!Array.isArray(body.items) || body.items.length === 0) reject('8001');
      let itemId = [...db.prescriptions.values()].reduce(
        (max, rx) => Math.max(max, ...rx.items.map((i) => i.id)),
        0,
      );
      const items: PrescriptionItemRow[] = body.items.map((entry: unknown) => {
        if (!entry || typeof entry !== 'object' || Array.isArray(entry)) reject('2002');
        const item = entry as Record<string, unknown>;
        const name = optString(item, 'medicine_name')?.trim();
        if (!name) reject('8002');
        itemId++;
        return {
          id: itemId,
          medicine_name: name,
          dosage: optString(item, 'dosage')?.trim() || null,
          frequency: optString(item, 'frequency')?.trim() || null,
          duration: optString(item, 'duration')?.trim() || null,
          instruction: optString(item, 'instruction')?.trim() || null,
        };
      });
      const now = nowString();
      const id = nextId(db.prescriptions);
      const row: PrescriptionRow = {
        id,
        medical_record_id: recordId,
        doctor_id: user.user_id,
        doctor_name: user.full_name,
        note: optString(body, 'note')?.trim() || null,
        items,
        created_at: now,
        updated_at: now,
      };
      db.prescriptions.set(id, row);
      return created(row);
    },
  ],
  [
    'GET',
    '/lab-results/:id',
    (req) => {
      const { record } = readRecord(req, paramInt(req, 'id'));
      const rows = [...db.lab_results.values()]
        .filter((lab) => lab.medical_record_id === record.medical_record_id)
        .sort((a, b) => b.created_at.localeCompare(a.created_at) || b.id - a.id);
      return ok(rows);
    },
  ],
  [
    'POST',
    '/lab-requests',
    (req) => {
      const user = requirePermission(req, 'request_labs');
      const body = readBody(req);
      const recordId = parseRecordIdFromBody(body);
      const record = db.medical_records.get(recordId);
      if (!record) reject('4001', 'Medical record not found');
      if (!Array.isArray(body.items) || body.items.length === 0) reject('8101');
      const note = optString(body, 'note')?.trim() || null;
      const now = nowString();
      const requestId =
        [...db.lab_results.values()].reduce((max, row) => Math.max(max, row.lab_request_id), 0) + 1;
      const createdItems: LabResultRow[] = body.items.map((entry: unknown) => {
        if (!entry || typeof entry !== 'object' || Array.isArray(entry)) reject('2002');
        const item = entry as Record<string, unknown>;
        const testName = optString(item, 'test_name')?.trim();
        if (!testName) reject('8102');
        const id = nextId(db.lab_results);
        const row: LabResultRow = {
          id,
          lab_request_id: requestId,
          medical_record_id: recordId,
          doctor_id: user.user_id,
          test_name: testName,
          description: optString(item, 'description')?.trim() || null,
          note,
          result_value: null,
          reference_range: null,
          status: 'pending',
          created_at: now,
          updated_at: now,
        };
        db.lab_results.set(id, row);
        return row;
      });
      return created({
        id: requestId,
        medical_record_id: recordId,
        note,
        items: createdItems,
        created_at: now,
      });
    },
  ],
];
