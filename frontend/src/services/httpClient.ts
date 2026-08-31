import axios from 'axios';
import type { AxiosInstance, AxiosResponse } from 'axios';
import { API_CONFIG } from '../config';

const DEFAULT_HEADERS = {
  'Content-Type': 'application/json',
} as const;

export const createHttpClient = (): AxiosInstance => (
  axios.create({
    baseURL: API_CONFIG.BASE_URL,
    timeout: API_CONFIG.TIMEOUT,
    withCredentials: true,
    headers: DEFAULT_HEADERS,
  })
);

export const rawApiClient = createHttpClient();

export const unwrapResponseData = async <T>(request: Promise<AxiosResponse<T>>): Promise<T> => {
  const response = await request;
  return response.data;
};
