import { Check, FileImage, Trash2 } from 'lucide-react';
import {
  formatEventSource,
  getEventImage,
  getEventSourceKey,
  getReviewBadge,
  shortId,
} from '../../../shared/lib/utils';
import type { EventItem } from '../../../shared/types';
import { Badge, Button } from '../../../shared/ui';
import type { EventGroup } from '../model/eventFilters';
import { isParserReviewEvent } from '../model/eventForm';
import {
  formatDateTime,
  formatEventCategory,
  formatMoney,
} from '../../../shared/lib/utils';

type EventsTableProps = {
  events: EventItem[];
  group: EventGroup;
  authorNames: Record<string, string>;
  rowBusyId: string | null;
  refreshing: boolean;
  onEdit: (event: EventItem) => void | Promise<void>;
  onDelete: (event: EventItem) => void | Promise<void>;
  onPublish: (event: EventItem) => void | Promise<void>;
};

export const EventsTable = ({
  events,
  group,
  authorNames,
  rowBusyId,
  refreshing,
  onEdit,
  onDelete,
  onPublish,
}: EventsTableProps) => {
  return (
    <div className={`table-shell${refreshing ? ' table-shell--refreshing' : ''}`}>
      <table className="data-table">
        <thead>
          <tr>
            <th>Event</th>
            <th>Review type</th>
            <th>Author</th>
            <th>Date</th>
            <th>Category</th>
            <th>Price</th>
            <th />
          </tr>
        </thead>
        <tbody>
          {events.map((event) => {
            const review = getReviewBadge(event);
            const authorId = event.createdBy ?? event.updatedBy;
            const image = getEventImage(event);
            const parserReview = isParserReviewEvent(event);
            const sourceKey = getEventSourceKey(event);
            const canApprove = event.status === 'inactive' || event.status === 'parsed' || parserReview;
            const isRowBusy = rowBusyId === event._id;

            return (
              <tr
                className="data-row data-row--interactive"
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
                <td>
                  <div className="table-item">
                    <div className="table-item__media">
                      {image ? <img alt={event.title} src={image} /> : <FileImage size={18} />}
                    </div>
                    <div>
                      <strong>{event.title}</strong>
                      <span>
                        {event.address}
                        {group === 'moderation' && sourceKey !== 'manual' ? ` · ${formatEventSource(event)}` : ''}
                      </span>
                    </div>
                  </div>
                </td>
                <td>
                  <Badge tone={review.tone}>{review.label}</Badge>
                </td>
                <td>{authorId ? authorNames[authorId] ?? shortId(authorId) : '—'}</td>
                <td>{formatDateTime(event.event_date)}</td>
                <td>{formatEventCategory(event.category)}</td>
                <td>{formatMoney(event.price)}</td>
                <td>
                  <div className="table-actions">
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
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};
