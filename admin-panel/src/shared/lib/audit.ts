import type { AuditRecord, ToastTone } from '../types';

const AUDIT_STORAGE_KEY = 'mapa-admin.audit';
const MAX_AUDIT_RECORDS = 120;

export const readAuditRecords = (): AuditRecord[] => {
  if (typeof window === 'undefined') {
    return [];
  }

  try {
    const raw = window.localStorage.getItem(AUDIT_STORAGE_KEY);
    if (!raw) {
      return [];
    }
    const parsed = JSON.parse(raw) as AuditRecord[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

export const appendAuditRecord = (entry: {
  actor: string;
  action: string;
  target: string;
  details?: string;
  status?: ToastTone;
}) => {
  if (typeof window === 'undefined') {
    return;
  }

  const records = readAuditRecords();
  const next: AuditRecord = {
    id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
    actor: entry.actor,
    action: entry.action,
    target: entry.target,
    details: entry.details,
    status: entry.status ?? 'info',
    createdAt: new Date().toISOString(),
  };

  window.localStorage.setItem(
    AUDIT_STORAGE_KEY,
    JSON.stringify([next, ...records].slice(0, MAX_AUDIT_RECORDS)),
  );
};

export const clearAuditRecords = () => {
  if (typeof window === 'undefined') {
    return;
  }

  window.localStorage.removeItem(AUDIT_STORAGE_KEY);
};
