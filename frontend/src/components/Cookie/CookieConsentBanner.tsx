import { useEffect, useState } from 'react';
import { enableYandexMetrika } from '../../services/yandexMetrika';
import { enableGoogleAnalytics } from '../../services/googleAnalytics';

type ConsentSettings = {
  necessary: true;
  functional: boolean;
  analytics: boolean;
  marketing: boolean;
};

const CONSENT_KEY = 'techCookieConsent';
const defaultSettings: ConsentSettings = { necessary: true, functional: false, analytics: false, marketing: false };

const readConsent = (): ConsentSettings | null => {
  const saved = window.localStorage.getItem(CONSENT_KEY);
  if (!saved) return null;

  try {
    const parsed = JSON.parse(saved);
    if (parsed === null) return null;
    if (typeof parsed === 'object' && parsed !== null) {
      return {
        necessary: true,
        functional: Boolean(parsed.functional),
        analytics: Boolean(parsed.analytics),
        marketing: Boolean(parsed.marketing),
      };
    }
  } catch {
    // Support the previous simple accepted/rejected storage value.
  }

  return saved === 'accepted' ? { necessary: true, functional: true, analytics: true, marketing: true } : defaultSettings;
};

function ConsentSwitch({ enabled, onChange, label }: { enabled: boolean; onChange: () => void; label: string }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={enabled}
      aria-label={label}
      onClick={onChange}
      className={`relative h-7 w-12 shrink-0 rounded-full transition-colors ${enabled ? 'bg-accent' : 'bg-brand-border'}`}
    >
      <span className={`absolute left-1 top-1 h-5 w-5 rounded-full bg-white shadow-sm transition-transform ${enabled ? 'translate-x-5' : 'translate-x-0'}`} />
    </button>
  );
}

export function CookieConsentBanner() {
  const [visible, setVisible] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [settings, setSettings] = useState<ConsentSettings>(defaultSettings);

  useEffect(() => {
    const saved = readConsent();
    if (!saved) {
      setVisible(true);
      return;
    }
    setSettings(saved);
    if (saved.analytics) {
      enableYandexMetrika();
      enableGoogleAnalytics();
    }
  }, []);

  useEffect(() => {
    const openSettingsFromMap = () => {
      setSettings(readConsent() || defaultSettings);
      setSettingsOpen(true);
      setVisible(true);
    };

    window.addEventListener('mapa:open-cookie-settings', openSettingsFromMap);
    return () => window.removeEventListener('mapa:open-cookie-settings', openSettingsFromMap);
  }, []);

  const save = (nextSettings: ConsentSettings) => {
    window.localStorage.setItem(CONSENT_KEY, JSON.stringify(nextSettings));
    setSettings(nextSettings);
    if (nextSettings.analytics) {
      enableYandexMetrika();
      enableGoogleAnalytics();
    }
    setVisible(false);
    setSettingsOpen(false);
  };

  return (
    <>
      {visible ? (
        <>
          <div aria-hidden="true" className="fixed inset-0 z-[99] bg-brand/20 sm:hidden" />
      <section
      role="dialog"
      aria-modal="true"
      aria-labelledby="cookie-consent-title"
      className="fixed bottom-[82px] left-1/2 z-[100] w-[90vw] max-w-[360px] -translate-x-1/2 rounded-[12px] border border-brand-tint bg-[#fffdfd] p-4 text-brand shadow-app-lg sm:bottom-7 sm:left-auto sm:right-7 sm:w-[360px] sm:translate-x-0"
    >
      {settingsOpen ? (
        <>
          <h2 id="cookie-consent-title" className="text-[15px] font-semibold leading-none">Cookie settings</h2>
          <p className="mt-2 text-[11px] leading-[1.35] text-brand-muted">
            We use cookies to keep the service working properly. You can choose which optional cookies to allow.
          </p>

          <div className="mt-3 space-y-3">
            <div className="flex gap-3">
              <div className="min-w-0 flex-1">
                <h3 className="text-[12px] font-medium">Necessary cookies</h3>
                <p className="mt-0.5 text-[10px] leading-[1.3] text-brand-muted">They are required for the site, sign-in, and saving settings.</p>
              </div>
              <span className="mt-1 text-[10px] text-brand-muted">Always on</span>
            </div>
            <div className="flex gap-3">
              <div className="min-w-0 flex-1">
                <h3 className="text-[12px] font-medium">Analytics cookies</h3>
                <p className="mt-0.5 text-[10px] leading-[1.3] text-brand-muted">They help us understand how you use the service and improve it.</p>
              </div>
              <ConsentSwitch label="Analytics cookies" enabled={settings.analytics} onChange={() => setSettings((current) => ({ ...current, analytics: !current.analytics }))} />
            </div>
            <div className="flex gap-3">
              <div className="min-w-0 flex-1">
                <h3 className="text-[12px] font-medium">Functional cookies</h3>
                <p className="mt-0.5 text-[10px] leading-[1.3] text-brand-muted">They save additional settings and preferences.</p>
              </div>
              <ConsentSwitch label="Functional cookies" enabled={settings.functional} onChange={() => setSettings((current) => ({ ...current, functional: !current.functional }))} />
            </div>
            <div className="flex gap-3">
              <div className="min-w-0 flex-1">
                <h3 className="text-[12px] font-medium">Marketing cookies</h3>
                <p className="mt-0.5 text-[10px] leading-[1.3] text-brand-muted">They help tailor displayed events to your interests.</p>
              </div>
              <ConsentSwitch label="Marketing cookies" enabled={settings.marketing} onChange={() => setSettings((current) => ({ ...current, marketing: !current.marketing }))} />
            </div>
          </div>

          <div className="mt-4 grid gap-2">
            <button type="button" onClick={() => save(settings)} className="h-8 rounded-[7px] bg-brand text-[11px] font-medium text-white transition-colors hover:bg-[#431a3a]">Apply</button>
            <button type="button" onClick={() => save(defaultSettings)} className="h-7 text-[11px] font-medium text-brand underline decoration-brand-border underline-offset-2">Reject optional</button>
          </div>
        </>
      ) : (
        <>
          <h2 id="cookie-consent-title" className="text-[15px] font-semibold leading-none">Cookie settings</h2>
          <p className="mt-2 text-[11px] leading-[1.4] text-brand-muted">
            We use cookies to keep the service working properly and show relevant events. You can change your choices in cookie settings.
          </p>
          <div className="mt-3 grid gap-2">
            <button type="button" onClick={() => save({ necessary: true, functional: true, analytics: true, marketing: true })} className="h-8 rounded-[7px] bg-brand text-[11px] font-medium text-white transition-colors hover:bg-[#431a3a]">Accept all</button>
            <button type="button" onClick={() => save(defaultSettings)} className="h-7 rounded-[7px] bg-accent-soft text-[11px] font-medium text-brand">Reject optional</button>
            <button type="button" onClick={() => setSettingsOpen(true)} className="h-7 text-[11px] font-medium text-brand underline decoration-brand-border underline-offset-2">Customize cookies</button>
          </div>
        </>
      )}
      </section>
        </>
      ) : null}
    </>
  );
}
