import { Check, FileImage, Trash2 } from 'lucide-react';
import {
  formatDateTime,
  formatEventCategory,
  formatEventSource,
  getEventImage,
  getEventSourceKey,
  getReviewBadge,
} from '../../../shared/lib/utils';
import type { EventItem } from '../../../shared/types';
import { Badge, Button } from '../../../shared/ui';
import type { EventGroup } from '../model/eventFilters';
import { isParserReviewEvent } from '../model/eventForm';

type EventMobileCardsProps = {
  events: EventItem[];
  group: EventGroup;
  rowBusyId: string | null;
  refreshing: boolean;
  onEdit: (event: EventItem) => void | Promise<void>;
  onDelete: (event: EventItem) => void | Promise<void>;
  onPublish: (event: EventItem) => void | Promise<void>;
};

export const EventMobileCards = ({
  events,
  group,
  rowBusyId,
  refreshing,
  onEdit,
  onDelete,
  onPublish,
}: EventMobileCardsProps) => {
  return (
    <div className={`mobile-card-list${refreshing ? ' mobile-card-list--refreshing' : ''}`}>
      {events.map((event) => {
        const review = getReviewBadge(event);
        const image = getEventImage(event);
        const parserReview = isParserReviewEvent(event);
        const sourceKey = getEventSourceKey(event);
        const canApprove = event.status === 'inactive' || event.status === 'parsed' || parserReview;
        const isRowBusy = rowBusyId === event._id;

        return (
          <article
            className="event-card event-card--interactive"
            key={event._id}
            onClick={() => void onEdit(event)}
            onKeyDown={(keyboardEvent) => {
              if (keyboardEvent.key === 'Enter' || keyboardEvent.key === ' ') {
                keyboardEvent.preventDefault();
                void onEdit(event);
              }
            }}
            role="button"
            tabIndex={0}
          >
            <div className="event-card__content">
              <div className="event-card__media">
                {image ? <img alt={event.title} src={image} /> : <FileImage size={18} />}
              </div>
              <div className="event-card__body">
                <div className="event-card__top">
                  <strong>{event.title}</strong>
                  <Badge tone={review.tone}>{review.label}</Badge>
                </div>
                <p>
                  {event.address}
                  {group === 'moderation' && sourceKey !== 'manual' ? ` · ${formatEventSource(event)}` : ''}
                </p>
                <div className="event-card__meta">
                  <span>{formatEventCategory(event.category)}</span>
                  <span>{formatDateTime(event.event_date)}</span>
                </div>
              </div>
            </div>
            <div className="event-card__actions">
              {group === 'moderation' && canApprove ? (
                <Button
                  disabled={isRowBusy}
                  icon={Check}
                  onClick={(clickEvent) => {
                    clickEvent.stopPropagation();
                    void onPublish(event);
                  }}
                  size="sm"
                  tone="success"
                >
                  {parserReview && event.status !== 'parsed' ? 'Apply' : 'Approve'}
                </Button>
              ) : null}
              {group === 'moderation' ? (
                <Button
                  disabled={isRowBusy}
                  icon={Trash2}
                  onClick={(clickEvent) => {
                    clickEvent.stopPropagation();
                    void onDelete(event);
                  }}
                  size="sm"
                  tone="danger"
                >
                  {parserReview ? 'Reject' : 'Delete'}
                </Button>
              ) : null}
            </div>
          </article>
        );
      })}
    </div>
  );
};
