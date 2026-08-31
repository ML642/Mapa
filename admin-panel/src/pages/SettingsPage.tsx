import { RotateCcw, Server } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { fetchApiStatus } from '../features/status/api';
import { useSession } from '../features/session/useSession';
import { ENV } from '../shared/config/env';
import {
  formatDateTime,
  formatRole,
  formatSubscriptionType,
  normalizeErrorMessage,
} from '../shared/lib/utils';
import type { HealthStatus } from '../shared/types';
import { Button, InlineMessage, PageHeader, SectionCard, StatCard } from '../shared/ui';

export const SettingsPage = () => {
  const { accessToken, logout, status, user } = useSession();
  const [health, setHealth] = useState<HealthStatus | null>(null);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setError('');
    try {
      setHealth(await fetchApiStatus());
    } catch (loadError) {
      setError(normalizeErrorMessage(loadError, 'Failed to check API status'));
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <>
      <PageHeader
        eyebrow="Workspace"
        title="Settings"
        subtitle="Session details, API status, and environment information used by the admin panel."
        actions={
          <Button icon={RotateCcw} onClick={() => void load()} tone="secondary">
            Refresh API status
          </Button>
        }
      />

      {error ? <InlineMessage title="Status error" tone="danger">{error}</InlineMessage> : null}

      <div className="stats-grid stats-grid--compact">
        <StatCard caption="Current application session" label="Session status" tone="neutral" value={status} />
        <StatCard caption={ENV.apiUrl} label="Backend" tone="accent" value={health?.status ?? 'Unknown'} />
        <StatCard
          caption="Access token available in the current browser session"
          label="Access token"
          tone={accessToken ? 'success' : 'warning'}
          value={accessToken ? 'Present' : 'Missing'}
        />
      </div>

      <div className="two-column-layout">
        <SectionCard subtitle="Current admin account and session details." title="Session">
          <dl className="detail-list">
            <div>
              <dt>User</dt>
              <dd>{user?.username ?? '—'}</dd>
            </div>
            <div>
              <dt>Role</dt>
              <dd>{formatRole(user?.role)}</dd>
            </div>
            <div>
              <dt>Email</dt>
              <dd>{user?.email ?? '—'}</dd>
            </div>
            <div>
              <dt>Subscription</dt>
              <dd>{formatSubscriptionType(user?.type)}</dd>
            </div>
            <div>
              <dt>Last health check</dt>
              <dd>{health ? formatDateTime(new Date().toISOString()) : 'Not checked yet'}</dd>
            </div>
          </dl>

          <div className="action-grid">
            <Button onClick={() => void logout(false)} tone="secondary">
              Sign out
            </Button>
            <Button icon={Server} onClick={() => void logout(true)} tone="danger">
              Sign out all sessions
            </Button>
          </div>
        </SectionCard>

        <SectionCard subtitle="Environment details used by this workspace." title="Environment">
          <div className="insight-stack">
            <div className="insight-card">
              <strong>API endpoint</strong>
              <p>{ENV.apiUrl}</p>
            </div>
            <div className="insight-card">
              <strong>API commit</strong>
              <p>{health?.commit ?? 'Not available'}</p>
            </div>
            <div className="insight-card">
              <strong>API uptime</strong>
              <p>{health ? `${Math.round(health.uptime)} seconds` : 'Not available'}</p>
            </div>
          </div>
        </SectionCard>
      </div>
    </>
  );
};
