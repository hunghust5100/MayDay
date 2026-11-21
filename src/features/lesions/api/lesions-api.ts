import { api } from '@/core/api';
import type {
  EpisodeInput,
  LesionEpisode,
  LesionLocation,
  LesionPhoto,
  LocationInput,
  PhotoInput,
} from '../types';

type RawObservation = { context_tags: string[] | string | null };
function tags(value: RawObservation['context_tags']): string[] {
  if (Array.isArray(value)) return value;
  if (!value) return [];
  try {
    const list: unknown = JSON.parse(value);
    return Array.isArray(list) ? list.filter((v): v is string => typeof v === 'string') : [];
  } catch {
    return [];
  }
}
const episode = (row: Omit<LesionEpisode, 'context_tags'> & RawObservation): LesionEpisode => ({
  ...row,
  episode_id: String(row.episode_id),
  medical_record_id: Number(row.medical_record_id),
  patient_id: Number(row.patient_id),
  context_tags: tags(row.context_tags),
});
const location = (row: Omit<LesionLocation, 'context_tags'> & RawObservation): LesionLocation => ({
  ...row,
  lesion_location_id: String(row.lesion_location_id),
  episode_id: String(row.episode_id),
  context_tags: tags(row.context_tags),
});
const photo = (row: LesionPhoto): LesionPhoto => ({
  ...row,
  photo_id: String(row.photo_id),
  episode_id: String(row.episode_id),
  location_id: row.location_id == null ? null : String(row.location_id),
  attachment_id: String(row.attachment_id),
  ...Object.fromEntries(
    ['itch_score', 'pain_score', 'burn_score', 'hives_count', 'local_auas'].map((key) => [
      key,
      row[key as keyof LesionPhoto] == null || row[key as keyof LesionPhoto] === ''
        ? null
        : Number(row[key as keyof LesionPhoto]),
    ]),
  ),
});
const segment = encodeURIComponent;
export const lesionsApi = {
  episodes: async (recordId?: number, signal?: AbortSignal) =>
    (
      await api.get<LesionEpisode[]>('/lesion-episodes/my', {
        query: { medical_record_id: recordId },
        signal,
      })
    ).map(episode),
  episode: async (id: string, signal?: AbortSignal) =>
    episode(await api.get<LesionEpisode>(`/lesion-episodes/${segment(id)}`, { signal })),
  createEpisode: async (body: EpisodeInput) =>
    episode(
      await api.post<LesionEpisode>('/lesion-episodes', {
        ...body,
        medical_record_id: String(body.medical_record_id),
        context_tags: JSON.stringify(body.context_tags),
      }),
    ),
  editEpisode: async (id: string, body: Omit<EpisodeInput, 'medical_record_id'>) =>
    episode(
      await api.patch<LesionEpisode>(`/lesion-episodes/${segment(id)}`, {
        ...body,
        context_tags: JSON.stringify(body.context_tags),
      }),
    ),
  deleteEpisode: (id: string) => api.delete(`/lesion-episodes/${segment(id)}`),
  locations: async (id: string, signal?: AbortSignal) =>
    (await api.get<LesionLocation[]>(`/lesion-locations/episode/${segment(id)}`, { signal })).map(location),
  createLocation: async (body: LocationInput) =>
    location(
      await api.post<LesionLocation>('/lesion-locations', {
        ...body,
        context_tags: JSON.stringify(body.context_tags),
      }),
    ),
  editLocation: async (id: string, body: Omit<LocationInput, 'episode_id'>) =>
    location(
      await api.patch<LesionLocation>(`/lesion-locations/${segment(id)}`, {
        ...body,
        context_tags: JSON.stringify(body.context_tags),
      }),
    ),
  deleteLocation: (id: string) => api.delete(`/lesion-locations/${segment(id)}`),
  // SLIDE9 p43 repeats loc03 by mistake; p42 specifies location_id and photo rows.
  photos: async (id: string, signal?: AbortSignal) =>
    (await api.get<LesionPhoto[]>(`/lesion-photos/location/${segment(id)}`, { signal })).map(photo),
  createPhoto: async (body: PhotoInput) =>
    photo(
      await api.post<LesionPhoto>('/lesion-photos', {
        ...body,
        ...Object.fromEntries(
          ['itch_score', 'pain_score', 'burn_score', 'hives_count', 'local_auas'].map((key) => [
            key,
            body[key as keyof PhotoInput] == null ? null : String(body[key as keyof PhotoInput]),
          ]),
        ),
      }),
    ),
  editPhoto: async (
    id: string,
    body: Pick<
      PhotoInput,
      | 'milestone'
      | 'itch_score'
      | 'pain_score'
      | 'burn_score'
      | 'hives_count'
      | 'local_auas'
      | 'annotated_url'
    >,
  ) =>
    photo(
      await api.patch<LesionPhoto>(`/lesion-photos/${segment(id)}/milestone`, {
        milestone: body.milestone,
        annotated_url: body.annotated_url,
        ...Object.fromEntries(
          ['itch_score', 'pain_score', 'burn_score', 'hives_count', 'local_auas'].map((key) => [
            key,
            body[key as keyof typeof body] == null ? null : String(body[key as keyof typeof body]),
          ]),
        ),
      }),
    ),
  deletePhoto: (id: string) => api.delete(`/lesion-photos/${segment(id)}`),
};
