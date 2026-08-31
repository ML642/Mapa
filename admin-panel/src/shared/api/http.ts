import axios from 'axios';
import type { AxiosError, AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import {
  ENV,
  getApiUrl,
  normalizeApiUrl,
  setResolvedApiUrl,
} from '../config/env';

type AuthHandlers = {
  getAccessToken: () => string | null;
  refreshAccessToken: () => Promise<string | null>;
  onUnauthorized: () => void;
};

type RetriableConfig = AxiosRequestConfig & {
  _retry?: boolean;
  _baseUrlRetried?: boolean;
};

const authHandlers: AuthHandlers = {
  getAccessToken: () => null,
  refreshAccessToken: async () => null,
  onUnauthorized: () => undefined,
};

export class AppApiError extends Error {
  status?: number;
  details?: unknown;
  requestUrl?: string;
  code?: string;

  constructor(
    message: string,
    status?: number,
    details?: unknown,
    requestUrl?: string,
    code?: string,
  ) {
    super(message);
    this.name = 'AppApiError';
    this.status = status;
    this.details = details;
    this.requestUrl = requestUrl;
    this.code = code;
  }
}

export const setHttpAuthHandlers = (handlers: Partial<AuthHandlers>) => {
  Object.assign(authHandlers, handlers);
};

const syncResolvedApiUrl = (nextBaseUrl: string) => {
  const resolved = setResolvedApiUrl(nextBaseUrl);
  rawClient.defaults.baseURL = resolved;
  apiClient.defaults.baseURL = resolved;
  return resolved;
};

const buildRequestUrl = (config?: AxiosRequestConfig) => {
  const requestPath = config?.url ?? '';

  if (!requestPath) {
    return normalizeApiUrl(config?.baseURL) || getApiUrl();
  }

  if (/^https?:\/\//i.test(requestPath)) {
    return requestPath;
  }

  const baseUrl = normalizeApiUrl(config?.baseURL) || getApiUrl();
  return `${baseUrl}/${requestPath.replace(/^\/+/, '')}`;
};

const getResponseMessage = (data: unknown) => {
  if (
    data &&
    typeof data === 'object' &&
    'message' in data &&
    typeof data.message === 'string' &&
    data.message.trim().length > 0
  ) {
    return data.message.trim();
  }

  return '';
};

const isRecoverableNetworkError = (error: AxiosError) =>
  !error.response &&
  (error.code === 'ERR_NETWORK' || error.message === 'Network Error');

const getNextBaseUrl = (config?: AxiosRequestConfig) => {
  if (ENV.hasExplicitApiUrl || ENV.apiUrlCandidates.length < 2) {
    return null;
  }

  const currentBaseUrl = normalizeApiUrl(config?.baseURL) || getApiUrl();
  const currentIndex = ENV.apiUrlCandidates.indexOf(currentBaseUrl);
  const nextIndex = currentIndex >= 0 ? currentIndex + 1 : 1;
  return ENV.apiUrlCandidates[nextIndex] ?? null;
};

const retryWithAlternativeBaseUrl = async (
  client: AxiosInstance,
  error: AxiosError,
) => {
  const config = (error.config ?? {}) as RetriableConfig;

  if (config._baseUrlRetried || !isRecoverableNetworkError(error)) {
    return null;
  }

  const nextBaseUrl = getNextBaseUrl(config);

  if (!nextBaseUrl) {
    return null;
  }

  config._baseUrlRetried = true;
  config.baseURL = syncResolvedApiUrl(nextBaseUrl);
  return client.request(config);
};

const buildStatusMessage = (status: number, backendMessage: string) => {
  if (status === 404) {
    return backendMessage
      ? `Endpoint not found: ${backendMessage}`
      : 'Endpoint not found (404)';
  }

  if (status >= 500) {
    return backendMessage
      ? `Server error: ${backendMessage}`
      : `Server error (${status})`;
  }

  return backendMessage || `Request failed (${status})`;
};

export const rawClient = axios.create({
  baseURL: getApiUrl(),
  withCredentials: true,
  timeout: 30_000,
});

export const apiClient = axios.create({
  baseURL: getApiUrl(),
  withCredentials: true,
  timeout: 30_000,
});

const mapAxiosError = (error: unknown) => {
  if (axios.isAxiosError(error)) {
    const requestUrl = buildRequestUrl(error.config);
    const responseStatus = error.response?.status;
    const responseMessage = getResponseMessage(error.response?.data);

    if (responseStatus) {
      return new AppApiError(
        buildStatusMessage(responseStatus, responseMessage),
        responseStatus,
        error.response?.data,
        requestUrl,
        error.code,
      );
    }

    if (error.code === 'ECONNABORTED') {
      return new AppApiError(
        `Backend timed out while responding from ${requestUrl}.`,
        undefined,
        undefined,
        requestUrl,
        error.code,
      );
    }

    if (isRecoverableNetworkError(error)) {
      return new AppApiError(
        `Backend unavailable: could not reach ${requestUrl}. Check API base URL, backend startup, or CORS.`,
        undefined,
        undefined,
        requestUrl,
        error.code,
      );
    }

    return new AppApiError(
      error.message || 'Request failed',
      undefined,
      undefined,
      requestUrl,
      error.code,
    );
  }

  if (error instanceof Error) {
    return new AppApiError(error.message);
  }

  return new AppApiError('Request failed');
};

syncResolvedApiUrl(getApiUrl());

rawClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const recovered = await retryWithAlternativeBaseUrl(rawClient, error);

    if (recovered) {
      return recovered;
    }

    return Promise.reject(mapAxiosError(error));
  },
);

apiClient.interceptors.request.use((config) => {
  const token = authHandlers.getAccessToken();

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const recovered = await retryWithAlternativeBaseUrl(apiClient, error);

    if (recovered) {
      return recovered;
    }

    const config = (error.config ?? {}) as RetriableConfig;
    const responseStatus = error.response?.status;
    const requestUrl = config.url ?? '';

    if (responseStatus !== 401 || config._retry || requestUrl.includes('/auth/refresh')) {
      return Promise.reject(mapAxiosError(error));
    }

    config._retry = true;

    try {
      const nextToken = await authHandlers.refreshAccessToken();

      if (!nextToken) {
        authHandlers.onUnauthorized();
        return Promise.reject(mapAxiosError(error));
      }

      config.headers = config.headers ?? {};
      config.headers.Authorization = `Bearer ${nextToken}`;
      return await apiClient.request(config);
    } catch (refreshError) {
      authHandlers.onUnauthorized();
      return Promise.reject(mapAxiosError(refreshError));
    }
  },
);

export const unwrapData = async <T>(request: Promise<AxiosResponse<T>>): Promise<T> => {
  const response = await request;
  return response.data;
};

export const toAppApiError = mapAxiosError;
