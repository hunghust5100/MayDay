import { authenticate, requirePatient } from '../core/auth';
import { ROLE } from '../config';
import { created, ok, reject, type MockRequest } from '../core/http';
import { deleteEpisodeTree, mediaRecord, parseBodyId } from '../core/media-access';
import type { RouteDef } from '../core/router';
import { checkDate, optString, queryInt, readBody, reqString } from '../core/validate';
import type { EpisodeRow, LocationRow, PhotoRow } from '../db/media-lesions';
import { db, nowString } from '../db/store';

type Body = Record<string, unknown>;
function timestamp(raw: unknown): string | null {
  if (raw == null || raw === '') return null;
  if (typeof raw !== 'string') reject('2002');
  const match = /^([0-9]{4}-[0-9]{2}-[0-9]{2})[ T]([0-9]{2}):([0-9]{2})(?::([0-9]{2}))?$/.exec(raw);
  if (!match) reject('2006');
  checkDate(match[1]);
  if (Number(match[2]) > 23 || Number(match[3]) > 59 || Number(match[4] ?? 0) > 59) reject('2006');
  return raw.replace('T', ' ').length === 16 ? raw.replace('T', ' ') + ':00' : raw.replace('T', ' ');
}
function observation(body: Body) {
  if (
    body.medication_unit != null &&
    body.medication_unit !== '' &&
    body.medication_unit !== 'hour' &&
    body.medication_unit !== 'day'
  )
    reject('2003');
  let tags: unknown;
  try {
    tags = typeof body.context_tags === 'string' ? JSON.parse(body.context_tags) : (body.context_tags ?? []);
  } catch {
    reject('2003');
  }
  if (!Array.isArray(tags) || tags.some((tag) => typeof tag !== 'string' || !tag.trim())) reject('2003');
  return {
    occurred_at: timestamp(body.occurred_at),
    context_tags: JSON.stringify(tags),
    context_other: optString(body, 'context_other') ?? null,
    medication_name: optString(body, 'medication_name') ?? null,
    medication_unit: optString(body, 'medication_unit') ?? null,
  };
}
function duration(body: Body, key: string) {
  const value = optString(body, key);
  if (value && (!Number.isFinite(Number(value)) || Number(value) < 0)) reject('2003');
  return value || null;
}
function readEpisode(req: MockRequest, id: string, write = false) {
  const episode = db.lesion_episodes.get(id);
  if (!episode) reject('7001');
  const context = mediaRecord(req, episode.medical_record_id, write);
  if (write && context.user.role_id !== ROLE.PATIENT) reject('3104');
  return { ...context, episode };
}
function readLocation(req: MockRequest, id: string, write = false) {
  const location = db.lesion_locations.get(id);
  if (!location) reject('7002');
  return { ...readEpisode(req, location.episode_id, write), location };
}
function readPhoto(req: MockRequest, write = false) {
  const photo = db.lesion_photos.get(req.params.id);
  if (!photo) reject('7003');
  return { ...readEpisode(req, photo.episode_id, write), photo };
}
function score(body: Body, key: string, max?: number): number | null {
  const value = body[key];
  if (value == null || value === '') return null;
  const n = typeof value === 'number' || typeof value === 'string' ? Number(value) : NaN;
  if (
    !Number.isFinite(n) ||
    n < 0 ||
    (max != null && n > max) ||
    (key === 'hives_count' && !Number.isInteger(n))
  )
    reject(max === 10 ? '7007' : '2003');
  return n;
}
function photoFields(body: Body) {
  const milestone = reqString(body, 'milestone');
  if (milestone !== 'start' && milestone !== 'peak' && milestone !== 'normal') reject('7006');
  const annotated = optString(body, 'annotated_url');
  if (annotated && !/^https?:\/\//.test(annotated)) reject('2003');
  return {
    milestone,
    itch_score: score(body, 'itch_score', 10),
    pain_score: score(body, 'pain_score', 10),
    burn_score: score(body, 'burn_score', 10),
    hives_count: score(body, 'hives_count'),
    local_auas: score(body, 'local_auas'),
    annotated_url: annotated || null,
  } as Pick<
    PhotoRow,
    'milestone' | 'itch_score' | 'pain_score' | 'burn_score' | 'hives_count' | 'local_auas' | 'annotated_url'
  >;
}
function photoResponse(photo: PhotoRow) {
  const file = db.media_attachments.get(photo.attachment_id);
  return {
    ...photo,
    attachment: file ? { attachment_id: file.id, file_url: file.file_url, file_name: file.file_name } : null,
  };
}
export const lesionRoutes: RouteDef[] = [
  [
    'GET',
    '/lesion-episodes/my',
    (req) => {
      const { user } = requirePatient(req);
      const recordId = queryInt(req, 'medical_record_id');
      if (recordId != null) mediaRecord(req, recordId);
      const episodes = [...db.lesion_episodes.values()]
        .filter(
          (e) => e.patient_id === user.user_id && (recordId == null || e.medical_record_id === recordId),
        )
        .sort((a, b) => b.created_at.localeCompare(a.created_at));
      if (
        !episodes.length &&
        ![...db.medical_records.values()].some(
          (r) => r.patient_id === user.user_id && (r.status === 'pending' || r.status === 'in_progress'),
        )
      )
        reject('4002');
      return ok(episodes);
    },
  ],
  [
    'POST',
    '/lesion-episodes',
    (req) => {
      const { user } = requirePatient(req);
      const body = readBody(req);
      const recordId = parseBodyId(body.medical_record_id);
      mediaRecord(req, recordId, true);
      const name = optString(body, 'name')?.trim();
      if (!name) reject('7004');
      const row: EpisodeRow = {
        ...observation(body),
        episode_id: String(db.next_episode_id++),
        medical_record_id: recordId,
        patient_id: user.user_id,
        name,
        medication_taken_ago: duration(body, 'medication_taken_ago'),
        description: optString(body, 'description') ?? null,
        created_at: nowString(),
        updated_at: nowString(),
      };
      db.lesion_episodes.set(row.episode_id, row);
      return created(row);
    },
  ],
  ['GET', '/lesion-episodes/:id', (req) => ok(readEpisode(req, req.params.id).episode)],
  [
    'PATCH',
    '/lesion-episodes/:id',
    (req) => {
      const { episode } = readEpisode(req, req.params.id, true);
      const body = { ...episode, ...readBody(req) };
      const name = reqString(body, 'name').trim();
      if (!name) reject('7004');
      const row: EpisodeRow = {
        ...episode,
        ...observation(body),
        name,
        medication_taken_ago: duration(body, 'medication_taken_ago'),
        description: optString(body, 'description') ?? null,
        updated_at: nowString(),
      };
      db.lesion_episodes.set(row.episode_id, row);
      return ok(row);
    },
  ],
  [
    'DELETE',
    '/lesion-episodes/:id',
    (req) => {
      const { episode } = readEpisode(req, req.params.id, true);
      deleteEpisodeTree(episode.episode_id);
      return ok();
    },
  ],
  [
    'GET',
    '/lesion-locations/episode/:episode_id',
    (req) => {
      readEpisode(req, req.params.episode_id);
      return ok([...db.lesion_locations.values()].filter((l) => l.episode_id === req.params.episode_id));
    },
  ],
  [
    'POST',
    '/lesion-locations',
    (req) => {
      authenticate(req);
      const body = readBody(req);
      const episodeId = reqString(body, 'episode_id');
      readEpisode(req, episodeId, true);
      const part = optString(body, 'body_part')?.trim();
      if (!part) reject('7005');
      const row: LocationRow = {
        ...observation(body),
        lesion_location_id: String(db.next_location_id++),
        episode_id: episodeId,
        body_part: part,
        medication_take: duration(body, 'medication_take'),
        created_at: nowString(),
        updated_at: nowString(),
      };
      db.lesion_locations.set(row.lesion_location_id, row);
      return created(row);
    },
  ],
  [
    'PATCH',
    '/lesion-locations/:id',
    (req) => {
      const { location } = readLocation(req, req.params.id, true);
      const body = { ...location, ...readBody(req) };
      const part = reqString(body, 'body_part').trim();
      if (!part) reject('7005');
      const row: LocationRow = {
        ...location,
        ...observation(body),
        body_part: part,
        medication_take: duration(body, 'medication_take'),
        updated_at: nowString(),
      };
      db.lesion_locations.set(row.lesion_location_id, row);
      return ok(row);
    },
  ],
  [
    'DELETE',
    '/lesion-locations/:id',
    (req) => {
      const { location } = readLocation(req, req.params.id, true);
      for (const [id, photo] of db.lesion_photos)
        if (photo.location_id === location.lesion_location_id) db.lesion_photos.delete(id);
      db.lesion_locations.delete(location.lesion_location_id);
      return ok();
    },
  ],
  [
    'POST',
    '/lesion-photos',
    (req) => {
      authenticate(req);
      const body = readBody(req);
      const episodeId = reqString(body, 'episode_id');
      const { user, record } = readEpisode(req, episodeId, true);
      const locationId = optString(body, 'location_id') || null;
      if (locationId && readLocation(req, locationId, true).location.episode_id !== episodeId) reject('2003');
      const attachmentId = reqString(body, 'attachment_id');
      const file = db.media_attachments.get(attachmentId);
      if (!file) reject('6005');
      if (file.user_id !== user.user_id) reject('3106');
      if (file.medical_record_id != null && file.medical_record_id !== record.medical_record_id)
        reject('2003');
      const row: PhotoRow = {
        ...photoFields(body),
        photo_id: String(db.next_photo_id++),
        episode_id: episodeId,
        location_id: locationId,
        attachment_id: attachmentId,
        taken_at: timestamp(body.taken_at),
        created_at: nowString(),
        updated_at: nowString(),
      };
      db.lesion_photos.set(row.photo_id, row);
      return created(photoResponse(row));
    },
  ],
  [
    'GET',
    '/lesion-photos/location/:location_id',
    (req) => {
      readLocation(req, req.params.location_id);
      return ok(
        [...db.lesion_photos.values()]
          .filter((p) => p.location_id === req.params.location_id)
          .sort((a, b) => (b.taken_at ?? b.created_at).localeCompare(a.taken_at ?? a.created_at))
          .map(photoResponse),
      );
    },
  ],
  [
    'PATCH',
    '/lesion-photos/:id/milestone',
    (req) => {
      const { photo } = readPhoto(req, true);
      const body = { ...photo, ...readBody(req) };
      const updated = { ...photo, ...photoFields(body), updated_at: nowString() };
      db.lesion_photos.set(photo.photo_id, updated);
      return ok(photoResponse(updated));
    },
  ],
  [
    'DELETE',
    '/lesion-photos/:id',
    (req) => {
      const { photo } = readPhoto(req, true);
      db.lesion_photos.delete(photo.photo_id);
      return ok();
    },
  ],
];
