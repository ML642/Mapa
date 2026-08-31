type Gtag = (...args: unknown[]) => void;

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: Gtag;
  }
}

const measurementId = (import.meta.env.VITE_GA_MEASUREMENT_ID || '').trim();
const SCRIPT_SELECTOR = 'script[data-google-analytics]';

export const enableGoogleAnalytics = () => {
  if (!measurementId || typeof window === 'undefined' || document.querySelector(SCRIPT_SELECTOR)) return;

  window.dataLayer = window.dataLayer || [];
  window.gtag = window.gtag || ((...args: unknown[]) => window.dataLayer?.push(args));
  window.gtag('js', new Date());
  window.gtag('config', measurementId);

  const script = document.createElement('script');
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(measurementId)}`;
  script.dataset.googleAnalytics = 'true';
  document.head.appendChild(script);
};
