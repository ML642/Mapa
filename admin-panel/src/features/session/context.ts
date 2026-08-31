import { createContext } from 'react';
import type { AuthUser } from '../../shared/types';

export type LoginPayload = {
  email: string;
  password: string;
};

export type SessionStatus = 'booting' | 'authenticated' | 'anonymous';

export type SessionContextValue = {
  accessToken: string | null;
  user: AuthUser | null;
  status: SessionStatus;
  isAuthenticated: boolean;
  login: (payload: LoginPayload) => Promise<void>;
  logout: (revokeAll?: boolean) => Promise<void>;
  refresh: () => Promise<string | null>;
  setUser: (updater: AuthUser | null | ((previous: AuthUser | null) => AuthUser | null)) => void;
};

export const SessionContext = createContext<SessionContextValue | null>(null);
