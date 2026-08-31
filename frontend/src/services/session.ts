import Cookies from 'js-cookie';
import { rawApiClient, unwrapResponseData } from './httpClient';
import {
  clearStoredUser,
  mergeStoredUser,
  readStoredUser,
  subscribeToStoredUser,
  writeStoredUser,
  type StoredUser,
} from './userSession';

const ACCESS_TOKEN_COOKIE_NAME = 'accessToken';
const ACCESS_TOKEN_FALLBACK_TTL_DAYS = 5;
const SESSION_REFRESH_LEEWAY_MS = 60_000;
const MAX_TIMEOUT_MS = 2_147_483_647;
const SESSION_UPDATED_EVENT = 'mapa:session-updated';

export type SessionSnapshot = {
  accessToken: string | null;
  user: StoredUser | null;
  isAuthenticated: boolean;
};

let currentAccessToken: string | null = null;
let refreshPromise: Promise<string | null> | null = null;
let bootstrapPromise: Promise<SessionSnapshot> | null = null;
let refreshTimerId: number | null = null;

const isBrowser = () => typeof window !== 'undefined';

const readAccessTokenCookie = () => {
  if (typeof document === 'undefined') {
    return currentAccessToken;
  }

  return Cookies.get(ACCESS_TOKEN_COOKIE_NAME) || null;
};

const syncAccessTokenFromCookie = () => {
  currentAccessToken = readAccessTokenCookie();
  return currentAccessToken;
};

const decodeJwtPayload = (token: string): { exp?: number } | null => {
  const parts = token.split('.');
  if (parts.length < 2) {
    return null;
  }

  try {
    const base64 = parts[1]
      .replace(/-/g, '+')
      .replace(/_/g, '/')
      .padEnd(Math.ceil(parts[1].length / 4) * 4, '=');

    const decoded = atob(base64);
    return JSON.parse(decoded) as { exp?: number };
  } catch {
    return null;
  }
};

const getAccessTokenExpiryDate = (token: string): Date | null => {
  const exp = decodeJwtPayload(token)?.exp;
  if (!exp) {
    return null;
  }

  const expiryDate = new Date(exp * 1000);
  return Number.isNaN(expiryDate.getTime()) ? null : expiryDate;
};

const emitSessionUpdate = () => {
  if (!isBrowser()) {
    return;
  }

  window.dispatchEvent(
    new CustomEvent<SessionSnapshot>(SESSION_UPDATED_EVENT, {
      detail: getSessionSnapshot(),
    }),
  );
};

const clearRefreshTimer = () => {
  if (!isBrowser() || refreshTimerId === null) {
    return;
  }

  window.clearTimeout(refreshTimerId);
  refreshTimerId = null;
};

const persistAccessToken = (token: string | null, { emit = true }: { emit?: boolean } = {}) => {
  clearRefreshTimer();
  currentAccessToken = token;

  if (!token) {
    Cookies.remove(ACCESS_TOKEN_COOKIE_NAME, { path: '/' });

    if (emit) {
      emitSessionUpdate();
    }
    return;
  }

  const expires = getAccessTokenExpiryDate(token) ?? ACCESS_TOKEN_FALLBACK_TTL_DAYS;
  Cookies.set(ACCESS_TOKEN_COOKIE_NAME, token, {
    expires,
    path: '/',
    sameSite: 'Strict',
    secure: isBrowser() ? window.location.protocol === 'https:' : false,
  });

  scheduleAccessTokenRefresh(token);

  if (emit) {
    emitSessionUpdate();
  }
};

const fetchCurrentSessionUser = async (accessToken: string): Promise<StoredUser | null> => {
  try {
    const payload = await unwrapResponseData(
      rawApiClient.get<unknown>('/user/me', {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }),
    );

    return writeStoredUser(payload);
  } catch {
    return null;
  }
};

const scheduleAccessTokenRefresh = (token: string | null = syncAccessTokenFromCookie()) => {
  if (!isBrowser()) {
    return;
  }

  clearRefreshTimer();

  if (!token) {
    return;
  }

  const expiryDate = getAccessTokenExpiryDate(token);
  if (!expiryDate) {
    return;
  }

  const delayMs = expiryDate.getTime() - Date.now() - SESSION_REFRESH_LEEWAY_MS;
  const safeDelayMs = Math.min(Math.max(delayMs, 0), MAX_TIMEOUT_MS);

  refreshTimerId = window.setTimeout(() => {
    refreshTimerId = null;
    void refreshAccessToken();
  }, safeDelayMs);
};

export const getSessionAccessToken = () => syncAccessTokenFromCookie();

export const getSessionSnapshot = (): SessionSnapshot => {
  const accessToken = getSessionAccessToken();
  const user = readStoredUser();

  return {
    accessToken,
    user,
    isAuthenticated: Boolean(accessToken && user),
  };
};

export const canRefreshSession = () => Boolean(getSessionAccessToken() || readStoredUser());

export const readSessionUserId = () => getSessionSnapshot().user?.id || null;

export const writeAuthenticatedSession = (payload: { accessToken: string; user: unknown }) => {
  persistAccessToken(payload.accessToken, { emit: false });
  writeStoredUser(payload.user);
};

export const mergeSessionUser = (partialUser: Partial<StoredUser>) => mergeStoredUser(partialUser);

export const clearAuthenticatedSession = () => {
  const hadStoredUser = Boolean(readStoredUser());
  persistAccessToken(null, { emit: !hadStoredUser });

  if (hadStoredUser) {
    clearStoredUser();
  }
};

export const refreshAccessToken = async (): Promise<string | null> => {
  if (refreshPromise) {
    return refreshPromise;
  }

  if (!canRefreshSession()) {
    return null;
  }

  refreshPromise = (async () => {
    try {
      const payload = await unwrapResponseData(
        rawApiClient.post<{ accessToken?: string }>('/auth/refresh'),
      );

      const nextAccessToken = typeof payload.accessToken === 'string' ? payload.accessToken : null;
      if (!nextAccessToken) {
        throw new Error('Missing access token in refresh response');
      }

      persistAccessToken(nextAccessToken);

      if (!readStoredUser()) {
        const restoredUser = await fetchCurrentSessionUser(nextAccessToken);
        if (!restoredUser) {
          throw new Error('Unable to restore user after refresh');
        }
      }

      return nextAccessToken;
    } catch {
      clearAuthenticatedSession();
      return null;
    } finally {
      refreshPromise = null;
    }
  })();

  return refreshPromise;
};

export const bootstrapSession = async (): Promise<SessionSnapshot> => {
  if (bootstrapPromise) {
    return bootstrapPromise;
  }

  bootstrapPromise = (async () => {
    const initialSnapshot = getSessionSnapshot();

    if (!initialSnapshot.accessToken && !initialSnapshot.user) {
      return initialSnapshot;
    }

    if (initialSnapshot.accessToken) {
      scheduleAccessTokenRefresh(initialSnapshot.accessToken);

      if (initialSnapshot.user) {
        return getSessionSnapshot();
      }

      const restoredUser = await fetchCurrentSessionUser(initialSnapshot.accessToken);
      if (restoredUser) {
        return getSessionSnapshot();
      }
    }

    const refreshedToken = await refreshAccessToken();
    if (!refreshedToken) {
      return getSessionSnapshot();
    }

    if (!readStoredUser()) {
      const restoredUser = await fetchCurrentSessionUser(refreshedToken);
      if (!restoredUser) {
        clearAuthenticatedSession();
      }
    }

    return getSessionSnapshot();
  })().finally(() => {
    bootstrapPromise = null;
  });

  return bootstrapPromise;
};

export const subscribeToSession = (callback: (snapshot: SessionSnapshot) => void) => {
  if (!isBrowser()) {
    return () => undefined;
  }

  const handleSessionUpdate = (event: Event) => {
    const snapshot = (event as CustomEvent<SessionSnapshot>).detail ?? getSessionSnapshot();
    callback(snapshot);
  };

  const unsubscribeStoredUser = subscribeToStoredUser(() => {
    callback(getSessionSnapshot());
  });

  window.addEventListener(SESSION_UPDATED_EVENT, handleSessionUpdate as EventListener);

  return () => {
    unsubscribeStoredUser();
    window.removeEventListener(SESSION_UPDATED_EVENT, handleSessionUpdate as EventListener);
  };
};

scheduleAccessTokenRefresh();
