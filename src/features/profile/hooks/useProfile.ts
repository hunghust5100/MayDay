import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { session } from '@/core/auth';
import { shortName } from '@/shared/utils';

import { profileApi } from '../api/profile-api';

const PROFILE_KEY = ['profile'] as const;

export function useProfile() {
  return useQuery({ queryKey: PROFILE_KEY, queryFn: ({ signal }) => profileApi.get(signal) });
}

/** Cập nhật hồ sơ; đổi họ tên thì cập nhật luôn tên hiển thị trong phiên. */
export function useUpdateProfile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: profileApi.update,
    onSuccess: async (profile) => {
      queryClient.setQueryData(PROFILE_KEY, profile);
      await session.updateUser({ full_name: profile.full_name, display_name: shortName(profile.full_name) });
    },
  });
}
