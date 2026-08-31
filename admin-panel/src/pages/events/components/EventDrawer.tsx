import { Check, Save, Trash2 } from 'lucide-react';
import type { EventItem } from '../../../shared/types';
import {
  Drawer,
  InlineMessage,
  LoadingState,
  SectionCard,
  Button,
} from '../../../shared/ui';
import { isParserReviewEvent, type EventCoordinates, type EventFormState } from '../model/eventForm';
import { EventForm } from './EventForm';
import { EventImagesBlock } from './EventImagesBlock';

type EventDrawerProps = {
  isOpen: boolean;
  isCreatingEvent: boolean;
  selectedEventId: string | null;
  selectedEvent: EventItem | null;
  formState: EventFormState | null;
  loading: boolean;
  busy: boolean;
  error: string;
  title: string;
  subtitle: string;
  pendingFiles: File[];
  selectedImageIndexes: string[];
  onClose: () => void;
  onSave: () => void | Promise<void>;
  onApprove: () => void | Promise<void>;
  onDelete: () => void | Promise<void>;
  onChange: (patch: Partial<EventFormState>) => void;
  onCoordinatesChange: (coordinates: EventCoordinates) => void;
  onDatePartChange: (index: number, part: 'date' | 'time', value: string) => void;
  onAddDate: () => void;
  onRemoveDate: (index: number) => void;
  onPendingFilesChange: (files: File[]) => void;
  onToggleImageSelection: (index: string, checked: boolean) => void;
  onUploadImages: () => void | Promise<void>;
  onDeleteImages: () => void | Promise<void>;
};

export const EventDrawer = ({
  isOpen,
  isCreatingEvent,
  selectedEventId,
  selectedEvent,
  formState,
  loading,
  busy,
  error,
  title,
  subtitle,
  pendingFiles,
  selectedImageIndexes,
  onClose,
  onSave,
  onApprove,
  onDelete,
  onChange,
  onCoordinatesChange,
  onDatePartChange,
  onAddDate,
  onRemoveDate,
  onPendingFilesChange,
  onToggleImageSelection,
  onUploadImages,
  onDeleteImages,
}: EventDrawerProps) => {
  const canApprove = Boolean(
    !isCreatingEvent
    && selectedEvent
    && (selectedEvent.status === 'inactive' || selectedEvent.status === 'parsed' || isParserReviewEvent(selectedEvent)),
  );

  return (
    <Drawer onClose={onClose} open={isOpen} subtitle={subtitle} title={title}>
      {loading || !formState ? (
        <LoadingState label="Opening event…" />
      ) : (
        <div className="drawer-stack">
          {error ? (
            <InlineMessage title="Error" tone="danger">
              {error}
            </InlineMessage>
          ) : null}

          {isCreatingEvent ? (
            <InlineMessage title="Custom event draft" tone="info">
              Fill in the event details and save once to create a moderation draft.
            </InlineMessage>
          ) : null}

          {isParserReviewEvent(selectedEvent) && selectedEvent?.moderation?.diff ? (
            <SectionCard
              subtitle="Current values on the left, parser candidates on the right."
              title="Parser diff"
            >
              <div className="compact-list">
                {Object.entries(selectedEvent.moderation.diff).map(([field, diff]) => (
                  <article className="compact-list__item compact-list__item--dense" key={field}>
                    <div>
                      <strong>{field}</strong>
                      <span>current: {JSON.stringify(diff?.current ?? null)}</span>
                    </div>
                    <div className="compact-list__meta">
                      <span>parsed: {JSON.stringify(diff?.parsed ?? null)}</span>
                    </div>
                  </article>
                ))}
              </div>
            </SectionCard>
          ) : null}

          {!isCreatingEvent && selectedEvent ? (
            <EventImagesBlock
              busy={busy}
              onDeleteSelected={onDeleteImages}
              onPendingFilesChange={onPendingFilesChange}
              onToggleImageSelection={onToggleImageSelection}
              onUpload={onUploadImages}
              pendingFiles={pendingFiles}
              selectedEvent={selectedEvent}
              selectedImageIndexes={selectedImageIndexes}
            />
          ) : null}

          <EventForm
            formState={formState}
            onAddDate={onAddDate}
            onChange={onChange}
            onCoordinatesChange={onCoordinatesChange}
            onDatePartChange={onDatePartChange}
            onRemoveDate={onRemoveDate}
            selectedEventId={selectedEventId}
          />

          <div className="drawer-actions drawer-actions--spread">
            <div className="drawer-actions">
              <Button disabled={busy} icon={Save} onClick={() => void onSave()}>
                {isCreatingEvent ? 'Create event' : 'Save'}
              </Button>
              {canApprove ? (
                <Button disabled={busy} icon={Check} onClick={() => void onApprove()} tone="success">
                  {isParserReviewEvent(selectedEvent) && selectedEvent?.status !== 'parsed' ? 'Apply changes' : 'Publish'}
                </Button>
              ) : null}
            </div>
            {!isCreatingEvent ? (
              <Button disabled={busy} icon={Trash2} onClick={() => void onDelete()} tone="danger">
                {isParserReviewEvent(selectedEvent) ? 'Reject' : 'Delete'}
              </Button>
            ) : null}
          </div>
        </div>
      )}
    </Drawer>
  );
};
