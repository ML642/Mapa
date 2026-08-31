import type { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { createHttpClient, unwrapResponseData } from './httpClient';
import {
  canRefreshSession,
  getSessionAccessToken,
  refreshAccessToken,
} from './session';
import { notifyAuthRequired } from './authRequiredNotice';

type RetriableRequestConfig = InternalAxiosRequestConfig & {
  _retry?: boolean;
  skipAuthRefresh?: boolean;
  skipAuthRequiredNotice?: boolean;
};

const apiClient = createHttpClient();

const AUTH_NOTICE_IGNORED_PATH_PREFIXES = [
  '/auth/login',
  '/auth/register',
  '/auth/verify',
  '/auth/google',
  '/auth/refresh',
  '/auth/reset-password',
];

const getRequestPath = (url?: string) => {
  if (!url) {
    return '';
  }

  try {
    return new URL(url, 'http://local').pathname;
  } catch {
    return url;
  }
};

const shouldShowAuthRequiredNotice = (request?: RetriableRequestConfig) => {
  if (!request || request.skipAuthRequiredNotice) {
    return false;
  }

  const requestPath = getRequestPath(request.url);
  return !AUTH_NOTICE_IGNORED_PATH_PREFIXES.some((pathPrefix) =>
    requestPath.startsWith(pathPrefix),
  );
};

apiClient.interceptors.request.use(
  (config) => {
    const token = getSessionAccessToken();

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error),
);

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as RetriableRequestConfig | undefined;

    if (error.response?.status !== 401 || !originalRequest) {
      return Promise.reject(error);
    }

    const canAttemptRefresh =
      !originalRequest._retry &&
      !originalRequest.skipAuthRefresh &&
      canRefreshSession();

    if (canAttemptRefresh) {
      originalRequest._retry = true;

      const refreshedToken = await refreshAccessToken();
      if (refreshedToken) {
        originalRequest.headers.Authorization = `Bearer ${refreshedToken}`;
        return apiClient(originalRequest);
      }
    }

    if (shouldShowAuthRequiredNotice(originalRequest)) {
      notifyAuthRequired();
    }

    return Promise.reject(error);
  },
);

export { unwrapResponseData };
export default apiClient;
