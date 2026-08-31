import { apiClient, unwrapData } from '../../shared/api/http';
import type { UserLookupResult, UserProfile } from '../../shared/types';

export const searchUsersByUsername = async (username: string) => {
  try {
    const data = await unwrapData<UserLookupResult[]>(apiClient.get(`/user/username/${encodeURIComponent(username)}`));
    return data.map((entry) => ({
      ...entry,
      userId: entry.userId ?? entry.id,
    }));
  } catch (error) {
    if (error instanceof Error && error.message.includes('Users not found')) {
      return [];
    }
    throw error;
  }
};

export const fetchUserById = (userId: string) =>
  unwrapData<UserProfile>(apiClient.get(`/user/${userId}`));

export const updateUserRole = (userId: string, role: string) =>
  unwrapData<{ message: string }>(apiClient.put(`/user/update/role/${userId}`, { role }));

export const revokeUserSessions = (userId: string) =>
  unwrapData<{ message: string; revokedCount?: number }>(apiClient.post('/auth/revoke', { userId }));

export const deleteUser = (userId: string) =>
  unwrapData<{ message: string }>(apiClient.delete(`/user/delete/${userId}`));
