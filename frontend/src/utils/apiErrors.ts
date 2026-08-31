import { isAxiosError } from 'axios';

type ApiErrorMessageOptions = {
  fallbackMessage?: string;
  serverMessageMap?: Record<string, string>;
  statusMessageMap?: Partial<Record<number, string>>;
};

const STATUS_MESSAGE_MAP: Record<number, string> = {
  400: 'We could not process your request. Check the information and try again.',
  401: 'Your session has expired. Please sign in again.',
  403: 'You do not have permission to perform this action.',
  404: 'The requested information could not be found.',
  405: 'This action is not currently available.',
  408: 'The server took too long to respond. Please try again.',
  409: 'There was a data conflict. Refresh the page and try again.',
  410: 'This information is no longer available.',
  422: 'We could not process the information. Check the fields and try again.',
  429: 'Too many requests. Please wait a moment and try again.',
  500: 'Something went wrong on our side. Please try again later.',
  501: 'This feature is not supported yet.',
  502: 'The service is temporarily unavailable. Please try again later.',
  503: 'The service is temporarily unavailable. Please try again later.',
  504: 'The server could not process the request in time. Please try again later.',
};

const SERVER_MESSAGE_MAP: Record<string, string> = {
  Unauthorized: STATUS_MESSAGE_MAP[401],
  Forbidden: STATUS_MESSAGE_MAP[403],
  'Token not provided': STATUS_MESSAGE_MAP[401],
  'Refresh token required': STATUS_MESSAGE_MAP[401],
  'Refresh token is required': STATUS_MESSAGE_MAP[401],
  'Invalid or expired refresh token': STATUS_MESSAGE_MAP[401],
  'Refresh token revoked': STATUS_MESSAGE_MAP[401],
  'Token not found': STATUS_MESSAGE_MAP[401],
  'Device mismatch': 'This session is no longer valid. Please sign in again.',
  'User not found, please contact support if your token is still valid':
    'User not found. If the problem persists, please contact support.',
  'User is not verified': 'Verify your email address to continue.',
  'User is banned': 'Your account has been restricted. Please contact support.',
  'Internal server error': STATUS_MESSAGE_MAP[500],
  GOOGLE_TOKEN_REQUIRED: 'We could not sign you in with Google. Please try again.',
  INVALID_GOOGLE_TOKEN: 'We could not sign you in with Google. Please try again.',
  GOOGLE_EMAIL_NOT_VERIFIED: 'The email address on your Google account has not been verified.',
  EMAIL_REGISTERED_WITH_PASSWORD: 'This email address is already registered. Please sign in with your password.',
  EMAIL_BLACKLISTED: 'This email address cannot be used.',
  MISSING_USER_AGENT: 'We could not complete the action. Refresh the page and try again.',
  REFRESH_TOKEN_REQUIRED: STATUS_MESSAGE_MAP[401],
  'Event(s) not found': 'No events were found.',
  'Event not found': 'The event could not be found.',
  'No events found': 'No events were found.',
  'Invalid ID format': 'The identifier format is invalid.',
  'Missing search query': 'Enter a search query.',
  'Updating forbidden fields': 'These fields cannot be changed.',
  'Email already used': 'An account with this email address already exists.',
  'Email is blacklisted': 'This email address cannot be used.',
  'User is already verified': 'This account is already verified. Please sign in.',
  'Invalid verification code': 'The verification code is invalid.',
  'Verification code has expired': 'The verification code has expired. Request a new one.',
  'Invalid user agent': 'We could not complete the action. Refresh the page and try again.',
  'Email and password are required': 'Enter your email address and password.',
  'Incorrect email or password': 'The email address or password is incorrect.',
  'File required': 'Choose a file to upload.',
  'No profile fields to update': 'There is no profile information to update.',
  'Updating denied fields is not allowed': 'These fields cannot be changed.',
  'Role is required': 'Choose a role.',
  'Invalid role': 'The role is invalid.',
  'Invalid category': 'The category is invalid.',
  'Event is already approved': 'The event has already been approved.',
  'No parser review pending': 'There are no pending parser changes to review.',
  'No images to delete': 'There are no images to delete.',
  'Unsupported parser source': 'This parser source is not supported.',
  'Only queued or running runs can be cancelled': 'Only queued or running jobs can be cancelled.',
  'Favourite not found': 'The event was not found in your favourites.',
  'Favourite already added': 'The event is already in your favourites.',
  'Favourite not found in your favorites': 'The event was not found in your favourites.',
  'Users not found': 'No users were found.',
  'User already marked as deleted': 'This user has already been marked as deleted.',
  'This account has been deleted. Register again or contact support if this was a mistake':
    'This account has been deleted. Register again or contact support if this was a mistake.',
  'Forbidden: only user or their friends can see this list':
    'You do not have permission to view this list.',
  'Forbidden: only user can update their own profile':
    'You can only update your own profile.',
  "Forbidden: you can't set higher or equal role then yours":
    'You cannot assign a role that is equal to or higher than your own.',
  "Forbidden: you can't update this user": 'You cannot update this user.',
  "Forbidden: you can't delete this user": 'You cannot delete this user.',
  'Forbidden: only user can delete their own profile':
    'You can only delete your own profile.',
  'Parser run not found': 'The parser run could not be found.',
  'SELF REQUEST': 'You cannot send a friend request to yourself.',
  'ALREADY FRIENDS': 'You are already friends.',
  'REQUEST ALREADY SENT': 'The friend request has already been sent.',
  'NO REQUEST FOUND': 'The friend request could not be found.',
  'NOT FRIENDS': 'These users are not friends.',
  'NO OUTGOING REQUEST': 'The outgoing friend request could not be found.',
  'SELF CHECK': 'You cannot perform this action for yourself.',
  'CATEGORIES REQUIRED': 'Choose at least one category.',
  'INTERESTS NOT SET': 'Choose your interests first.',
  'INVALID STATE': 'The state is invalid.',
  'ALREADY WILL ATTEND': 'You have already marked that you are going.',
  'ALREADY MIGHT ATTEND': 'You have already marked that you might attend.',
  'ALREADY NOT ATTENDING': 'You have already marked that you are not attending.',
  'INVALID WEIGHTS OBJECT': 'The category preferences are invalid.',
  'INVALID WEIGHT VALUE': 'The category preference value is invalid.',
};

const containsCyrillic = (value: string) => /[А-Яа-яЁё]/.test(value);

const getStatusFallbackMessage = (
  status?: number,
  statusMessageMap?: Partial<Record<number, string>>,
) => {
  if (!status) return null;

  return statusMessageMap?.[status]
    ?? STATUS_MESSAGE_MAP[status]
    ?? (status >= 500 ? STATUS_MESSAGE_MAP[500] : null)
    ?? (status >= 400 ? STATUS_MESSAGE_MAP[400] : null);
};

export const extractApiServerMessage = (responseData: unknown) => {
  if (typeof responseData === 'string') return responseData;

  if (
    typeof responseData === 'object'
    && responseData
    && typeof (responseData as { message?: unknown }).message === 'string'
  ) {
    return (responseData as { message: string }).message;
  }

  return null;
};

export const getApiServerMessage = (error: unknown) => {
  if (!isAxiosError(error) || !error.response) return null;
  return extractApiServerMessage(error.response.data);
};

export const getApiErrorMessage = (
  error: unknown,
  options: ApiErrorMessageOptions = {},
) => {
  const { fallbackMessage, serverMessageMap, statusMessageMap } = options;

  if (isAxiosError(error)) {
    if (!error.response) {
      return 'We could not connect to the server. Check your connection and try again.';
    }

    const status = error.response.status;
    const serverMessage = extractApiServerMessage(error.response.data);
    const mappedServerMessage = serverMessage
      ? serverMessageMap?.[serverMessage] ?? SERVER_MESSAGE_MAP[serverMessage] ?? null
      : null;
    const statusMessage = getStatusFallbackMessage(status, statusMessageMap);

    if (status >= 500) {
      return mappedServerMessage ?? statusMessage ?? fallbackMessage ?? STATUS_MESSAGE_MAP[500];
    }

    if (mappedServerMessage) return mappedServerMessage;

    if (serverMessage) {
      return containsCyrillic(serverMessage)
        ? fallbackMessage ?? statusMessage ?? STATUS_MESSAGE_MAP[400]
        : serverMessage;
    }

    if (statusMessage) return statusMessage;
  }

  if (error instanceof Error && error.message) {
    return containsCyrillic(error.message)
      ? fallbackMessage ?? STATUS_MESSAGE_MAP[500]
      : error.message;
  }

  return fallbackMessage ?? 'We could not complete the request. Please try again.';
};
