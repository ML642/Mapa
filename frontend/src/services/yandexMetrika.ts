type YandexMetrika = ((counterId: number, method: string, options?: Record<string, unknown>) => void) & {
  a?: unknown[][];
  l?: number;
};

declare global {
  interface Window {
    ym?: YandexMetrika;
  }
}

const counterId = (import.meta.env.VITE_YANDEX_METRIKA_ID || '').trim();
const SCRIPT_SELECTOR = 'script[data-yandex-metrika]';

export const enableYandexMetrika = () => {
  if (!counterId || typeof window === 'undefined' || document.querySelector(SCRIPT_SELECTOR)) return;

  if (!window.ym) {
    const queuedMetrika = ((...args: unknown[]) => {
      queuedMetrika.a = queuedMetrika.a || [];
      queuedMetrika.a.push(args);
    }) as YandexMetrika;
    queuedMetrika.l = Date.now();
    window.ym = queuedMetrika;
  }

  window.ym(Number(counterId), 'init', {
    ssr: true,
    webvisor: true,
    clickmap: true,
    ecommerce: 'dataLayer',
    accurateTrackBounce: true,
    trackLinks: true,
  });

  const script = document.createElement('script');
  script.async = true;
  script.src = 'https://mc.yandex.ru/metrika/tag.js';
  script.dataset.yandexMetrika = 'true';
  document.head.appendChild(script);
};
