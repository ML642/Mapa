import { useEffect, useMemo, useState } from 'react';
import { fetchActiveEvents, fetchInactiveEvents, fetchParsedEvents } from '../features/events/api';
import {
  formatDateTime,
  getEventSourceKey,
  normalizeErrorMessage,
} from '../shared/lib/utils';
import type { EventItem } from '../shared/types';
import {
  Badge,
  EmptyState,
  InlineMessage,
  LoadingState,
  PageHeader,
  SectionCard,
  StatCard,
} from '../shared/ui';

type QualityIssue = {
  id: string;
  title: string;
  reason: string;
  severity: 'danger' | 'warning' | 'success';
  event: EventItem;
};

const buildIssues = (events: EventItem[]): QualityIssue[] =>
  events.flatMap((event) => {
    const issues: QualityIssue[] = [];

    if (!event.event_image?.length) {
      issues.push({
        id: `${event._id}-image`,
        title: event.title,
        reason: 'No images attached',
        severity: 'danger',
        event,
      });
    }

    if (!event.coordinates?.length || event.coordinates.every((value) => value === 0)) {
      issues.push({
        id: `${event._id}-coordinates`,
        title: event.title,
        reason: 'Map coordinates are missing or invalid',
        severity: 'warning',
        event,
      });
    }

    if (!event.phone && getEventSourceKey(event) === 'manual') {
      issues.push({
        id: `${event._id}-source`,
        title: event.title,
        reason: 'Source and contact information are missing',
        severity: 'warning',
        event,
      });
    }

    return issues;
  });

export const ComplaintsPage = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [events, setEvents] = useState<EventItem[]>([]);

  useEffect(() => {
    let active = true;

    const load = async () => {
      setLoading(true);
      setError('');

      try {
        const [activeEvents, inactiveEvents, parsedEvents] = await Promise.all([
          fetchActiveEvents({ page: 1, size: 20 }),
          fetchInactiveEvents({ page: 1, size: 20 }),
          fetchParsedEvents({ page: 1, size: 20 }),
        ]);

        if (active) {
          setEvents([...activeEvents.events, ...inactiveEvents.events, ...parsedEvents.events]);
        }
      } catch (loadError) {
        if (active) {
          setError(normalizeErrorMessage(loadError, 'Failed to load quality signals'));
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    void load();

    return () => {
      active = false;
    };
  }, []);

  const issues = useMemo(() => buildIssues(events), [events]);
  const criticalCount = issues.filter((item) => item.severity === 'danger').length;
  const warningCount = issues.filter((item) => item.severity === 'warning').length;

  return (
    <>
      <PageHeader
        eyebrow="Content health"
        title="Quality"
        subtitle="Automatic checks for missing media, bad coordinates, and incomplete source details."
      />

      {error ? <InlineMessage title="Loading error" tone="danger">{error}</InlineMessage> : null}

      <div className="stats-grid stats-grid--compact">
        <StatCard caption="Event cards without images" label="Critical" tone="danger" value={criticalCount} />
        <StatCard caption="Coordinates, source, and contact issues" label="Warnings" tone="warning" value={warningCount} />
        <StatCard caption="Total cards included in the check" label="Scanned" tone="neutral" value={events.length} />
      </div>

      <SectionCard subtitle="Automatically detected content issues." title="Signals">
        {loading ? (
          <LoadingState label="Scanning content quality…" />
        ) : issues.length ? (
          <div className="compact-list">
            {issues.map((issue) => (
              <article className="compact-list__item compact-list__item--dense" key={issue.id}>
                <div>
                  <strong>{issue.title}</strong>
                  <span>{issue.reason}</span>
                </div>
                <div className="compact-list__meta">
                  <Badge tone={issue.severity}>{issue.event.status ?? 'unknown'}</Badge>
                  <span>{formatDateTime(issue.event.event_date)}</span>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <EmptyState
            description="No quality issues were found in the current sample."
            title="No signals found"
          />
        )}
      </SectionCard>
    </>
  );
};
