import type { SessionSnapshot } from '../types';

const SESSION_STORAGE_KEY = 'mapa-admin.session';

export const readSessionSnapshot = (): SessionSnapshot => {
  if (typeof window === 'undefined') {
    return { accessToken: null, user: null };
  }

  try {
    const raw = window.localStorage.getItem(SESSION_STORAGE_KEY);

    if (!raw) {
      return { accessToken: null, user: null };
    }

    const parsed = JSON.parse(raw) as SessionSnapshot;
    return {
      accessToken: parsed.accessToken ?? null,
      user: parsed.user ?? null,
    };
  } catch {
    return { accessToken: null, user: null };
  }
};

export const writeSessionSnapshot = (snapshot: SessionSnapshot) => {
  if (typeof window === 'undefined') {
    return;
  }

  window.localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(snapshot));
};

export const clearSessionSnapshot = () => {
  if (typeof window === 'undefined') {
    return;
  }

  window.localStorage.removeItem(SESSION_STORAGE_KEY);
};
