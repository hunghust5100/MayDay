import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { lesionsApi } from '../api/lesions-api';
export const useEpisodes = (recordId?: number) =>
  useQuery({
    queryKey: ['lesions', 'episodes', recordId],
    queryFn: ({ signal }) => lesionsApi.episodes(recordId, signal),
  });
export const useEpisode = (id: string) =>
  useQuery({
    queryKey: ['lesions', 'episode', id],
    queryFn: ({ signal }) => lesionsApi.episode(id, signal),
    enabled: Boolean(id),
  });
export const useLocations = (id: string) =>
  useQuery({
    queryKey: ['lesions', 'locations', id],
    queryFn: ({ signal }) => lesionsApi.locations(id, signal),
    enabled: Boolean(id),
  });
export const useLesionPhotos = (id: string) =>
  useQuery({
    queryKey: ['lesions', 'photos', id],
    queryFn: ({ signal }) => lesionsApi.photos(id, signal),
    enabled: Boolean(id),
  });
export function useLesionMutation<T, R>(fn: (body: T) => Promise<R>) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: fn,
    onSuccess: () => client.invalidateQueries({ queryKey: ['lesions'] }),
  });
}
