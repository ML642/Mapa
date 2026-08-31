import { z } from 'zod';

export const usernameSchema = z
  .string()
  .trim()
  .min(2, 'Username must be at least 2 characters')
  .max(30, 'Username must not exceed 30 characters');

export const emailSchema = z
  .string()
  .trim()
  .min(1, 'Email address is required')
  .email('Enter a valid email address');

export const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .max(100, 'Password is too long');

export const codeSchema = z
  .string()
  .trim()
  .min(1, 'Enter the code from your email');

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Password is required'),
});

export const registerSchema = z.object({
  username: usernameSchema,
  email: emailSchema,
  password: passwordSchema,
});

export const forgotPasswordRequestSchema = z.object({
  email: emailSchema,
});

export const forgotPasswordVerifySchema = z.object({
  email: emailSchema,
  code: codeSchema,
});

export const forgotPasswordConfirmSchema = z.object({
  password: passwordSchema,
});
