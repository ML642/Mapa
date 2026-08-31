import { getApiErrorMessage, getApiServerMessage } from '../../utils/apiErrors';

const AUTH_ERROR_MESSAGE_MAP: Record<string, string> = {
    'Incorrect email or password':
        'Invalid email or password. If your account was created with Google, sign in with Google.',
    'Email and password are required': 'Enter your email and password.',
    'Email already used': 'An account with this email address already exists.',
    'Email is required': 'Enter your email address.',
    'Email is blacklisted': 'This email address cannot be used for registration.',
    'Invalid access token': 'Unable to sign in with Google. Please try again.',
    'Access token is required': 'Unable to sign in with Google. Please try again.',
    'Invalid user agent': 'Unable to sign in. Refresh the page and try again.',
    'User-Agent required': 'Unable to sign in. Refresh the page and try again.',
    'User agent is required': 'Unable to complete the action. Refresh the page and try again.',
    'This account has been deleted. Register again or contact support if this was a mistake':
        'This account has been deleted. Register again or contact support if this was a mistake.',
    'Username is required': 'Enter a username.',
    'Username must contain at least 2 characters': 'Username must be at least 2 characters.',
    'Username must not exceed 40 characters': 'Username must not exceed 40 characters.',
    'Username already used': 'This username is already taken.',
    'User not found': 'User not found.',
    'User is already verified': 'This account is already verified. Sign in.',
    'Invalid verification code': 'Invalid verification code.',
    'Verification code has expired': 'This verification code has expired. Request a new code.',
    'Reset password email sent successfully': 'A password reset email has been sent to your email address.',
    'Verification code sent to email': 'A verification code has been sent to your email address.',
    'Password has been successfully reset. Please log in with your new password.': 'Your password has been reset. Please sign in with your new password.',
    'Invalid or expired reset code': 'The verification code is invalid or has expired.',
    'Reset code has expired': 'The reset code has expired. Request a new code.',
    'INVALID_CODE': 'Invalid verification code.',
    'CODE_EXPIRED': 'The code has expired. Request a new code.',
    'USER_NOT_FOUND': 'No user was found with this email address.',
    'EMAIL_BLACKLISTED': 'This email address cannot be used for password recovery.',
};

export const getAuthServerMessage = (error: unknown) => getApiServerMessage(error);

export const getAuthErrorMessage = (
    error: unknown,
    fallbackMessage = 'Unable to sign in. Please try again.',
) => getApiErrorMessage(error, { fallbackMessage, serverMessageMap: AUTH_ERROR_MESSAGE_MAP });
