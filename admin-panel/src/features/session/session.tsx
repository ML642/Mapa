import {
  type PropsWithChildren,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { appendAuditRecord } from '../../shared/lib/audit';
import {
  clearSessionSnapshot,
  readSessionSnapshot,
  writeSessionSnapshot,
} from '../../shared/lib/storage';
import { rawClient, setHttpAuthHandlers, toAppApiError, unwrapData } from '../../shared/api/http';
import type { AuthUser } from '../../shared/types';
import { SessionContext, type LoginPayload, type SessionContextValue, type SessionStatus } from './context';

type AuthResponse = {
  accessToken: string;
  user: AuthUser;
};

export const SessionProvider = ({ children }: PropsWithChildren) => {
  const [snapshot, setSnapshot] = useState(readSessionSnapshot);
  const [status, setStatus] = useState<SessionStatus>('booting');
  const refreshRef = useRef<Promise<string | null> | null>(null);

  const commitSnapshot = useCallback((next: { accessToken: string | null; user: AuthUser | null }) => {
    setSnapshot(next);

    if (next.accessToken || next.user) {
      writeSessionSnapshot(next);
    } else {
      clearSessionSnapshot();
    }
  }, []);

  const refresh = useCallback(async () => {
    if (refreshRef.current) {
      return refreshRef.current;
    }

    refreshRef.current = (async () => {
      try {
        const data = await unwrapData<{ accessToken: string }>(rawClient.post('/auth/refresh'));
        commitSnapshot({
          accessToken: data.accessToken,
          user: snapshot.user,
        });
        setStatus(snapshot.user ? 'authenticated' : 'anonymous');
        return data.accessToken;
      } catch {
        return null;
      } finally {
        refreshRef.current = null;
      }
    })();

    return refreshRef.current;
  }, [commitSnapshot, snapshot.user]);

  const clearSession = useCallback((auditMessage?: string) => {
    if (auditMessage) {
      appendAuditRecord({
        actor: snapshot.user?.username ?? 'system',
        action: auditMessage,
        target: 'session',
        status: 'info',
      });
    }

    commitSnapshot({ accessToken: null, user: null });
    setStatus('anonymous');
  }, [commitSnapshot, snapshot.user?.username]);

  useEffect(() => {
    setHttpAuthHandlers({
      getAccessToken: () => snapshot.accessToken,
      refreshAccessToken: refresh,
      onUnauthorized: () => clearSession('Session expired'),
    });
  }, [clearSession, refresh, snapshot.accessToken]);

  useEffect(() => {
    let active = true;

    const bootstrap = async () => {
      if (!snapshot.user) {
        setStatus(snapshot.accessToken ? 'authenticated' : 'anonymous');
        return;
      }

      setStatus(snapshot.accessToken ? 'authenticated' : 'booting');

      if (!snapshot.accessToken) {
        const token = await refresh();
        if (!active) {
          return;
        }

        if (!token) {
          clearSession();
        }
        return;
      }
    };

    void bootstrap();

    return () => {
      active = false;
    };
  }, [clearSession, refresh, snapshot.accessToken, snapshot.user]);

  const login = useCallback(async (payload: LoginPayload) => {
    const data = await unwrapData<AuthResponse>(rawClient.post('/auth/login', payload));
    commitSnapshot({
      accessToken: data.accessToken,
      user: data.user,
    });
    setStatus('authenticated');
    appendAuditRecord({
      actor: data.user.username,
      action: 'Login',
      target: 'session',
      details: 'Signed in to admin panel',
      status: 'success',
    });
  }, [commitSnapshot]);

  const logout = useCallback(async (revokeAll?: boolean) => {
    const actor = snapshot.user?.username ?? 'system';

    try {
      if (snapshot.accessToken) {
        await rawClient.post(revokeAll ? '/auth/logout/all' : '/auth/logout', undefined, {
          headers: snapshot.accessToken ? { Authorization: `Bearer ${snapshot.accessToken}` } : undefined,
        });
      }
    } catch (error) {
      throw toAppApiError(error);
    } finally {
      clearSession();
      appendAuditRecord({
        actor,
        action: revokeAll ? 'Sign out all sessions' : 'Sign out',
        target: 'session',
        status: 'success',
      });
    }
  }, [clearSession, snapshot.accessToken, snapshot.user?.username]);

  const setUser = useCallback((updater: AuthUser | null | ((previous: AuthUser | null) => AuthUser | null)) => {
    const nextUser = typeof updater === 'function' ? updater(snapshot.user) : updater;
    commitSnapshot({
      accessToken: snapshot.accessToken,
      user: nextUser,
    });
  }, [commitSnapshot, snapshot.accessToken, snapshot.user]);

  const value = useMemo<SessionContextValue>(() => ({
    accessToken: snapshot.accessToken,
    user: snapshot.user,
    status,
    isAuthenticated: Boolean(snapshot.accessToken && snapshot.user),
    login,
    logout,
    refresh,
    setUser,
  }), [login, logout, refresh, setUser, snapshot.accessToken, snapshot.user, status]);

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
};
