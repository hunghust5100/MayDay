import { IMAGE_UPLOAD } from '@/shared/constants';
import { authenticate } from '../core/auth';
import { ROLE } from '../config';
import { created, ok, reject, type MockRequest } from '../core/http';
import { mediaAnswer, mediaRecord, parseBodyId } from '../core/media-access';
import type { RouteDef } from '../core/router';
import { optString, paramInt, readBody, reqString } from '../core/validate';
import { db, nowString } from '../db/store';
import { readClinicalTemplate } from '../db/template-reader';

async function upload(req: MockRequest) {
  const { user } = authenticate(req);
  const permission = [...db.permissions.values()].find((p) => p.name === 'upload_images');
  if (!db.role_permissions.some((p) => p.role_id === user.role_id && p.permission_id === permission?.id))
    reject('3103');
  const form = req.body as {
    get?: (key: string) => unknown;
    getAll?: (key: string) => unknown[];
    getParts?: () => { fieldName: string; string?: string; uri?: string; name?: string; type?: string }[];
  };
  if (!form || (typeof form.get !== 'function' && typeof form.getParts !== 'function')) reject('6001');
  const parts = form.getParts?.();
  const field = (key: string): unknown =>
    form.get ? form.get(key) : parts?.find((p) => p.fieldName === key)?.string;
  const files = form.getAll ? form.getAll('file') : (parts ?? []).filter((p) => p.fieldName === 'file');
  if (!files.length) reject('6001');
  if (files.length > 1) reject('6004');
  const file = files[0] as { uri?: string; size?: number; type?: string; name?: string };
  if (!file || typeof file !== 'object') reject('6001');
  const fileName = file.name;
  if (!IMAGE_UPLOAD.mimeTypes.includes(file.type ?? '')) reject('6002');
  if (file.size != null && file.size > IMAGE_UPLOAD.maxFileSize) reject('6003');
  let recordId: number | null = null;
  if (field('medical_record_id') != null && field('medical_record_id') !== '') {
    recordId = parseBodyId(field('medical_record_id'));
    mediaRecord(req, recordId, true);
  }
  const text = (key: string) => {
    const v = field(key);
    if (v == null || v === '') return null;
    if (typeof v !== 'string') reject('2002');
    return v;
  };
  const question = text('question_id');
  if (question && recordId == null) reject('2003');
  if (
    question &&
    recordId != null &&
    !readClinicalTemplate(db.medical_records.get(recordId)!.template_id)?.sections.some((s) =>
      s.questions.some((q) => q.question_id === question),
    )
  )
    reject('4008');
  let url: string;
  if (typeof file.uri === 'string')
    url = file.uri; // RN mock retains its own selected file URI.
  else if (typeof Blob !== 'undefined' && file instanceof Blob) {
    try {
      if (typeof FileReader !== 'undefined') {
        url = await new Promise<string>((resolve, fail) => {
          const reader = new FileReader();
          reader.onload = () =>
            typeof reader.result === 'string' ? resolve(reader.result) : fail(new Error('Read failed'));
          reader.onerror = fail;
          reader.readAsDataURL(file);
        });
      } else {
        const bytes = new Uint8Array(await file.arrayBuffer());
        let binary = '';
        for (let i = 0; i < bytes.length; i += 4096)
          binary += String.fromCharCode(...bytes.subarray(i, i + 4096));
        url = `data:${file.type};base64,${btoa(binary)}`;
      }
    } catch {
      reject('6007');
    }
  } else reject('6001');
  const id = String(db.next_media_id++);
  const row = {
    id,
    user_id: user.user_id,
    medical_record_id: recordId,
    question_id: question,
    file_path: `mock/${id}`,
    file_url: url,
    file_name: fileName ?? `image-${id}`,
    file_type: file.type!,
    media_type: 'image',
    category: text('category'),
    description: text('description'),
    created_at: nowString(),
  };
  db.media_attachments.set(id, row);
  return created(row);
}
function remove(req: MockRequest) {
  const { user } = authenticate(req);
  const row = db.media_attachments.get(req.params.id);
  if (!row) reject('6005');
  if (row.user_id !== user.user_id) reject('3106');
  const records = new Set<number>();
  if (row.medical_record_id != null) records.add(row.medical_record_id);
  for (const link of db.answer_images.values())
    if (link.attachment_id === row.id) {
      mediaAnswer(req, link.answer_id, true);
      const answer = db.answers.get(link.answer_id);
      if (answer) records.add(answer.medical_record_id);
    }
  for (const photo of db.lesion_photos.values())
    if (photo.attachment_id === row.id) {
      const episode = db.lesion_episodes.get(photo.episode_id);
      if (episode) records.add(episode.medical_record_id);
    }
  for (const id of records) mediaRecord(req, id, true);
  for (const [id, link] of db.answer_images) if (link.attachment_id === row.id) db.answer_images.delete(id);
  for (const [id, photo] of db.lesion_photos) if (photo.attachment_id === row.id) db.lesion_photos.delete(id);
  db.media_attachments.delete(row.id);
  return ok();
}
export const mediaRoutes: RouteDef[] = [
  ['POST', '/image-attachments/upload', upload],
  [
    'GET',
    '/image-attachments/user/:user_id',
    (req) => {
      const { user } = authenticate(req);
      const target = paramInt(req, 'user_id');
      if (target !== user.user_id) {
        if (user.role_id === ROLE.PATIENT) reject('3106');
        const permission = [...db.permissions.values()].find((p) => p.name === 'view_medical_records');
        if (
          !db.role_permissions.some((p) => p.role_id === user.role_id && p.permission_id === permission?.id)
        )
          reject('3103');
      }
      return ok(
        [...db.media_attachments.values()]
          .filter((a) => a.user_id === target)
          .sort((a, b) => b.created_at.localeCompare(a.created_at) || Number(b.id) - Number(a.id)),
      );
    },
  ],
  ['DELETE', '/image-attachments/:id', remove],
  [
    'POST',
    '/answer-images',
    (req) => {
      const body = readBody(req);
      const answerId = parseBodyId(body.answer_id);
      const { answer, record, user } = mediaAnswer(req, answerId, true);
      const attachmentId = reqString(body, 'attachment_id');
      const file = db.media_attachments.get(attachmentId);
      if (!file) reject('6005');
      if (file.user_id !== user.user_id && file.user_id !== record.patient_id) reject('3106');
      if (file.medical_record_id != null && file.medical_record_id !== record.medical_record_id)
        reject('2003');
      if (
        [...db.answer_images.values()].some(
          (link) => link.answer_id === answerId && link.attachment_id === attachmentId,
        )
      )
        reject('6006');
      const option = optString(body, 'option_value') || null;
      if (option) {
        const question = readClinicalTemplate(record.template_id)
          ?.sections.flatMap((s) => s.questions)
          .find((q) => q.question_id === answer.question_id);
        if (!question?.options?.some((o) => o.option_value === option)) reject('2003');
        const selected = answer.answer_value?.value;
        if (
          !(Array.isArray(selected) ? selected.includes(option) : selected === option) &&
          !question.options.some(
            (o) => o.option_value === option && Number(o.id) === answer.question_option_id,
          )
        )
          reject('2003');
      }
      const id = String(db.next_answer_image_id++);
      const link = {
        id,
        answer_id: answer.id,
        attachment_id: attachmentId,
        option_value: option,
        created_at: nowString(),
      };
      db.answer_images.set(id, link);
      return created(link);
    },
  ],
  [
    'GET',
    '/answer-images/:answer_id',
    (req) => {
      const { answer } = mediaAnswer(req, paramInt(req, 'answer_id'));
      return ok(
        [...db.answer_images.values()]
          .filter((link) => link.answer_id === answer.id)
          .flatMap((link) => {
            const file = db.media_attachments.get(link.attachment_id);
            return file
              ? [
                  {
                    ...link,
                    attachment: {
                      attachment_id: file.id,
                      file_url: file.file_url,
                      file_name: file.file_name,
                    },
                  },
                ]
              : [];
          }),
      );
    },
  ],
  [
    'DELETE',
    '/answer-images/:id',
    (req) => {
      authenticate(req);
      const link = db.answer_images.get(req.params.id);
      if (!link) reject('6005');
      mediaAnswer(req, link.answer_id, true);
      db.answer_images.delete(link.id);
      return ok();
    },
  ],
];
