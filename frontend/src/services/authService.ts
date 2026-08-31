import apiClient, { unwrapResponseData } from './apiClient';
import { rawApiClient } from './httpClient';

// Types
export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  username: string;
  email: string;
  password: string;
}

export interface VerifyEmailRequest {
  email: string;
  code: string | number;
}

export interface GoogleAuthRequest {
  token?: string;
  accessToken?: string;
}

export interface SetInterestsRequest {
  interests?: string[];
  categories?: string[];
}

export interface AuthUser {
  id?: string;
  _id?: string;
  username?: string;
  email?: string;
  avatar?: string;
  profilePicture?: string;
  bio?: string;
  role?: string;
  isPublic?: boolean;
  isPayed?: boolean;
  type?: string;
  payedUntil?: string | null;
}

export interface AuthResponse {
  accessToken: string;
  user: AuthUser;
  redirect?: string;
}

// Auth Service
export const authService = {
  /**
   * Login user
   */
  login: async (data: LoginRequest) => {
    return apiClient.post('/auth/login', data);
  },

  /**
   * Login user and return payload
   */
  loginUser: async (data: LoginRequest) => {
    return unwrapResponseData(apiClient.post<AuthResponse>('/auth/login', data));
  },

  /**
   * Register new user
   */
  register: async (data: RegisterRequest) => {
    return apiClient.post('/auth/register', data);
  },

  registerUser: async (data: RegisterRequest) => {
    return unwrapResponseData(apiClient.post('/auth/register', data));
  },

  /**
   * Send verification code to email
   */
  sendEmailVerification: async (email: string) => {
    return apiClient.post('/auth/verify/email/send', { email });
  },

  sendEmailVerificationCode: async (email: string) => {
    return unwrapResponseData(apiClient.post('/auth/verify/email/send', { email }));
  },

  /**
   * Verify email with code
   */
  verifyEmail: async (data: VerifyEmailRequest) => {
    return apiClient.post('/auth/verify/email', data);
  },

  verifyEmailCode: async (data: VerifyEmailRequest) => {
    return unwrapResponseData(apiClient.post<AuthResponse>('/auth/verify/email', data));
  },

  /**
   * Google OAuth login/register
   */
  googleAuth: async (data: GoogleAuthRequest) => {
    return apiClient.post('/auth/google', {
      accessToken: data.accessToken || data.token,
    });
  },

  googleAuthUser: async (data: GoogleAuthRequest) => {
    return unwrapResponseData(apiClient.post<AuthResponse>('/auth/google', {
      accessToken: data.accessToken || data.token,
    }));
  },

  /**
   * Set user interests (after registration)
   */
  setInterests: async (data: SetInterestsRequest) => {
    return apiClient.post('/recommendation/user/set/interests', {
      categories: data.categories || data.interests || [],
    });
  },

  setUserInterests: async (data: SetInterestsRequest) => {
    return unwrapResponseData(apiClient.post('/recommendation/user/set/interests', {
      categories: data.categories || data.interests || [],
    }));
  },

  /**
   * Request password reset code
   */
  requestPasswordReset: async (email: string) => {
    return unwrapResponseData(apiClient.post<{ message: string }>('/auth/reset-password/request', { email }));
  },

  /**
   * Verify password reset code and get reset token
   */
  verifyPasswordResetCode: async (email: string, code: string) => {
    return unwrapResponseData(apiClient.post<{ resetToken: string }>('/auth/reset-password/verify', { email, code }));
  },

  /**
   * Confirm password reset with new password
   */
  confirmPasswordReset: async (resetToken: string, password: string) => {
    const { data } = await rawApiClient.post<{ message: string }>(
      '/auth/reset-password/confirm',
      { password },
      { headers: { Authorization: `Bearer ${resetToken}` } },
    );
    return data;
  },
};

