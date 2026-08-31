import { RefreshCcw } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { fetchActiveEvents, fetchDeletedEvents, fetchInactiveEvents, fetchParsedEvents } from '../features/events/api';
import { fetchApiStatus } from '../features/status/api';
import { useSession } from '../features/session/useSession';
import { formatDateTime, getReviewBadge, normalizeErrorMessage } from '../shared/lib/utils';
import type { EventItem, HealthStatus } from '../shared/types';
import {
  Badge,
  Button,
  EmptyState,
  InlineMessage,
  LoadingState,
  PageHeader,
  SectionCard,
  StatCard,
} from '../shared/ui';

type DashboardData = {
  health: HealthStatus | null;
  activeCount: number;
  moderationCount: number;
  parsedCount: number;
  deletedCount: number;
  queue: EventItem[];
};

const emptyState: DashboardData = {
  health: null,
  activeCount: 0,
  moderationCount: 0,
  parsedCount: 0,
  deletedCount: 0,
  queue: [],
};

const getHealthIndicatorTone = (status?: string | null) => {
  const normalized = status?.trim().toLowerCase();

  if (!normalized) {
    return 'neutral';
  }

  if (['ok', 'healthy', 'up', 'online'].includes(normalized)) {
    return 'online';
  }

  if (['degraded', 'warning', 'slow'].includes(normalized)) {
    return 'warning';
  }

  return 'error';
};

export const DashboardPage = () => {
  const { user } = useSession();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [data, setData] = useState<DashboardData>(emptyState);
  const healthTone = getHealthIndicatorTone(data.health?.status);
  const healthLabel = loading && !data.health
    ? 'API checking'
    : data.health?.status
      ? `API ${data.health.status}`
      : 'API unavailable';

  const load = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      const [health, active, inactive, parsed, deleted] = await Promise.all([
        fetchApiStatus(),
        fetchActiveEvents({ page: 1, size: 1 }),
        fetchInactiveEvents({ page: 1, size: 4 }),
        fetchParsedEvents({ page: 1, size: 4 }),
        fetchDeletedEvents({ page: 1, size: 1 }),
      ]);

      setData({
        health,
        activeCount: active.total,
        moderationCount: inactive.total,
        parsedCount: parsed.total,
        deletedCount: deleted.total,
        queue: [...inactive.events, ...parsed.events]
          .sort((left, right) => (right.event_date ?? '').localeCompare(left.event_date ?? ''))
          .slice(0, 6),
      });
    } catch (loadError) {
      setError(normalizeErrorMessage(loadError, 'Failed to load dashboard data'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <>
      <PageHeader
        eyebrow="Admin overview"
        title="Dashboard"
        subtitle="A quick view of moderation, live events, archive size, and the current review load."
        actions={
          <div className="dashboard-header-actions">
            <div className={`dashboard-health-indicator dashboard-health-indicator--${healthTone}`}>
              <span className="dashboard-health-indicator__dot" />
              <span>{healthLabel}</span>
            </div>
            <Button icon={RefreshCcw} onClick={() => void load()} tone="secondary">
              Refresh
            </Button>
          </div>
        }
      />

      {error ? <InlineMessage title="Loading error" tone="danger">{error}</InlineMessage> : null}

      <div className="stats-grid stats-grid--dashboard">
        <StatCard caption="Currently visible on the site" label="Live events" tone="neutral" value={data.activeCount} />
        <StatCard caption="New submissions waiting for review" label="Requests" tone="warning" value={data.moderationCount} />
        <StatCard caption="Parser results waiting for review" label="Parser queue" tone="success" value={data.parsedCount} />
        <StatCard caption="Removed from the live catalog" label="Archive" tone="danger" value={data.deletedCount} />
        <StatCard caption="Current access level" label="Your role" tone="accent" value={user?.role ?? 'Unknown'} />
      </div>

      <div className="dashboard-grid">
        <SectionCard
          title="Moderation queue"
          subtitle="Newest items waiting for manual review."
        >
          {loading ? (
            <LoadingState label="Loading moderation queue…" />
          ) : data.queue.length ? (
            <div className="compact-list">
              {data.queue.map((event) => {
                const review = getReviewBadge(event);

                return (
                  <article className="compact-list__item" key={event._id}>
                    <div>
                      <strong>{event.title}</strong>
                      <span>{event.address}</span>
                    </div>
                    <div className="compact-list__meta">
                      <Badge tone={review.tone}>{review.label}</Badge>
                      <span>{formatDateTime(event.event_date)}</span>
                    </div>
                  </article>
                );
              })}
            </div>
          ) : (
            <EmptyState
              description="Nothing is waiting for review right now."
              title="Queue is empty"
            />
          )}
        </SectionCard>

        <SectionCard title="System snapshot" subtitle="Operational details that matter day to day.">
          <div className="insight-stack">
            <div className="insight-card">
              <strong>API uptime</strong>
              <p>{data.health ? `${Math.round(data.health.uptime)} seconds` : 'Not available yet'}</p>
            </div>
            <div className="insight-card">
              <strong>Last dashboard refresh</strong>
              <p>{loading ? 'Updating…' : formatDateTime(new Date().toISOString())}</p>
            </div>
            <div className="insight-card">
              <strong>Archive pressure</strong>
              <p>{data.deletedCount ? `${data.deletedCount} archived events currently stored` : 'Archive is currently empty'}</p>
            </div>
          </div>
        </SectionCard>
      </div>
    </>
  );
};
