const AUTH_REQUIRED_NOTICE_EVENT = 'mapa:auth-required';
const AUTH_REQUIRED_NOTICE_COOLDOWN_MS = 1_200;

export const AUTH_REQUIRED_NOTICE_MESSAGE = 'Sign in to complete this action.';

export type AuthRequiredNoticePayload = {
  id: number;
  message: string;
  requestedAt: number;
};

let lastNoticeAt = 0;
let noticeId = 0;

const isBrowser = () => typeof window !== 'undefined';

export const notifyAuthRequired = (message = AUTH_REQUIRED_NOTICE_MESSAGE) => {
  if (!isBrowser()) {
    return;
  }

  const now = Date.now();
  if (now - lastNoticeAt < AUTH_REQUIRED_NOTICE_COOLDOWN_MS) {
    return;
  }

  lastNoticeAt = now;
  noticeId += 1;

  window.dispatchEvent(
    new CustomEvent<AuthRequiredNoticePayload>(AUTH_REQUIRED_NOTICE_EVENT, {
      detail: {
        id: noticeId,
        message,
        requestedAt: now,
      },
    }),
  );
};

export const subscribeToAuthRequiredNotice = (
  callback: (payload: AuthRequiredNoticePayload) => void,
) => {
  if (!isBrowser()) {
    return () => undefined;
  }

  const handleNotice = (event: Event) => {
    callback((event as CustomEvent<AuthRequiredNoticePayload>).detail);
  };

  window.addEventListener(AUTH_REQUIRED_NOTICE_EVENT, handleNotice as EventListener);

  return () => {
    window.removeEventListener(AUTH_REQUIRED_NOTICE_EVENT, handleNotice as EventListener);
  };
};
