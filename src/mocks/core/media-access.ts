import { authenticate } from './auth';
import { ROLE } from '../config';
import { reject, type MockRequest } from './http';
import { db } from '../db/store';
import { readClinicalTemplate } from '../db/template-reader';

export function mediaRecord(req: MockRequest, recordId: number, write = false, answer = false) {
  const { user } = authenticate(req);
  const record = db.medical_records.get(recordId);
  if (!record) reject('4001');
  if (user.role_id === ROLE.PATIENT) {
    if (record.patient_id !== user.user_id) reject('3106');
  } else {
    const permission = [...db.permissions.values()].find((p) => p.name === 'view_medical_records');
    if (!db.role_permissions.some((p) => p.role_id === user.role_id && p.permission_id === permission?.id))
      reject('3103');
  }
  if (write) {
    if (record.status === 'completed' || record.status === 'cancelled') reject('4003');
    if (record.status !== 'pending' && record.status !== 'in_progress') reject('4004');
    if (user.role_id === ROLE.PATIENT) {
      if (answer && record.status !== 'pending') reject('3101');
    } else {
      const permission = [...db.permissions.values()].find((p) => p.name === 'edit_medical_records');
      if (!db.role_permissions.some((p) => p.role_id === user.role_id && p.permission_id === permission?.id))
        reject('3103');
      if (record.assigned_doctor_id !== user.user_id) reject('3105');
      if (record.status !== 'in_progress') reject('4004');
    }
  }
  return { user, record };
}
export function mediaAnswer(req: MockRequest, answerId: number, write = false) {
  const answer = db.answers.get(answerId);
  if (!answer) reject('2003');
  const context = mediaRecord(req, answer.medical_record_id, write, true);
  if (write) {
    const template = readClinicalTemplate(context.record.template_id);
    const section = template?.sections.find((s) =>
      s.questions.some((q) => q.question_id === answer.question_id),
    );
    // Builder templates are read using the shared clinical reader by the record handlers.
    if (
      section?.filled_by &&
      section.filled_by !== 'both' &&
      section.filled_by !== 'patdoc' &&
      section.filled_by !== (context.user.role_id === ROLE.PATIENT ? 'patient' : 'doctor')
    )
      reject('3101');
  }
  return { ...context, answer };
}
export function deleteEpisodeTree(episodeId: string) {
  for (const [id, photo] of db.lesion_photos) if (photo.episode_id === episodeId) db.lesion_photos.delete(id);
  for (const [id, location] of db.lesion_locations)
    if (location.episode_id === episodeId) db.lesion_locations.delete(id);
  db.lesion_episodes.delete(episodeId);
}
export function deleteRecordMedia(recordId: number) {
  for (const [id, link] of db.answer_images)
    if (db.answers.get(link.answer_id)?.medical_record_id === recordId) db.answer_images.delete(id);
  for (const [id, episode] of db.lesion_episodes)
    if (episode.medical_record_id === recordId) deleteEpisodeTree(id);
  for (const file of db.media_attachments.values())
    if (file.medical_record_id === recordId) file.medical_record_id = null;
}
export function parseBodyId(raw: unknown): number {
  const id =
    typeof raw === 'number' ? raw : typeof raw === 'string' && /^[1-9][0-9]*$/.test(raw) ? Number(raw) : NaN;
  if (!Number.isSafeInteger(id) || id < 1) reject('2002');
  return id;
}
