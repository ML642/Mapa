export interface StoredUser {
  id?: string;
  _id?: string;
  username?: string;
  email?: string;
  role?: string;
  profilePicture?: string;
  bio?: string;
  isPublic?: boolean;
  isPayed?: boolean;
  type?: string;
  payedUntil?: string | null;
}

const USER_STORAGE_KEY = 'user';
const AUTH_STORAGE_KEY = 'auth';
const USER_UPDATED_EVENT = 'mapa:user-updated';

export const normalizeStoredUser = (user: unknown): StoredUser | null => {
  if (!user || typeof user !== 'object') {
    return null;
  }

  const source = user as Record<string, unknown>;
  const id = typeof source.id === 'string'
    ? source.id
    : typeof source._id === 'string'
      ? source._id
      : undefined;
  const profilePicture = typeof source.profilePicture === 'string'
    ? source.profilePicture
    : typeof source.avatar === 'string'
      ? source.avatar
      : undefined;

  return {
    ...source,
    id,
    profilePicture,
  } as StoredUser;
};

const emitStoredUserUpdate = (user: StoredUser | null) => {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent<StoredUser | null>(USER_UPDATED_EVENT, { detail: user }));
};

export const readStoredUser = (): StoredUser | null => {
  if (typeof window === 'undefined') return null;

  const rawValue = window.localStorage.getItem(USER_STORAGE_KEY);
  if (!rawValue) return null;

  try {
    return normalizeStoredUser(JSON.parse(rawValue));
  } catch (error) {
    console.error('Failed to parse user from localStorage:', error);
    return null;
  }
};

export const writeStoredUser = (user: unknown): StoredUser | null => {
  if (typeof window === 'undefined') return null;

  const normalizedUser = normalizeStoredUser(user);
  if (!normalizedUser) {
    return null;
  }

  window.localStorage.setItem(AUTH_STORAGE_KEY, 'true');
  window.localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(normalizedUser));
  emitStoredUserUpdate(normalizedUser);

  return normalizedUser;
};

export const mergeStoredUser = (partialUser: Partial<StoredUser>) => {
  const currentUser = readStoredUser() || {};
  return writeStoredUser({ ...currentUser, ...partialUser });
};

export const clearStoredUser = () => {
  if (typeof window === 'undefined') return;

  window.localStorage.removeItem(AUTH_STORAGE_KEY);
  window.localStorage.removeItem(USER_STORAGE_KEY);
  emitStoredUserUpdate(null);
};

export const subscribeToStoredUser = (callback: (user: StoredUser | null) => void) => {
  if (typeof window === 'undefined') {
    return () => undefined;
  }

  const handleCustomUpdate = (event: Event) => {
    callback((event as CustomEvent<StoredUser | null>).detail ?? readStoredUser());
  };

  const handleStorageUpdate = (event: StorageEvent) => {
    if (event.key && event.key !== USER_STORAGE_KEY && event.key !== AUTH_STORAGE_KEY) {
      return;
    }

    callback(readStoredUser());
  };

  window.addEventListener(USER_UPDATED_EVENT, handleCustomUpdate as EventListener);
  window.addEventListener('storage', handleStorageUpdate);

  return () => {
    window.removeEventListener(USER_UPDATED_EVENT, handleCustomUpdate as EventListener);
    window.removeEventListener('storage', handleStorageUpdate);
  };
};
