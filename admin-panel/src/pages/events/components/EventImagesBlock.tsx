import { ExternalLink, Trash2, Upload } from 'lucide-react';
import { buildAssetUrl } from '../../../shared/config/env';
import type { EventItem } from '../../../shared/types';
import {
  Button,
  EmptyState,
  InlineMessage,
  SectionCard,
} from '../../../shared/ui';
import { extractImageIndex } from '../model/eventForm';

type EventImagesBlockProps = {
  selectedEvent: EventItem;
  pendingFiles: File[];
  selectedImageIndexes: string[];
  busy: boolean;
  onPendingFilesChange: (files: File[]) => void;
  onToggleImageSelection: (index: string, checked: boolean) => void;
  onUpload: () => void | Promise<void>;
  onDeleteSelected: () => void | Promise<void>;
};

export const EventImagesBlock = ({
  selectedEvent,
  pendingFiles,
  selectedImageIndexes,
  busy,
  onPendingFilesChange,
  onToggleImageSelection,
  onUpload,
  onDeleteSelected,
}: EventImagesBlockProps) => {
  return (
    <>
      <div className="gallery-grid">
        {(selectedEvent.event_image ?? []).length ? (
          selectedEvent.event_image!.map((imagePath) => {
            const index = extractImageIndex(imagePath);
            const isSelected = index ? selectedImageIndexes.includes(index) : false;

            return (
              <label className={`gallery-card${isSelected ? ' gallery-card--selected' : ''}`} key={imagePath}>
                <img alt={selectedEvent.title} src={buildAssetUrl(imagePath)} />
                {index ? (
                  <span className="gallery-card__check">
                    <input
                      checked={isSelected}
                      onChange={(event) => onToggleImageSelection(index, event.target.checked)}
                      type="checkbox"
                    />
                  </span>
                ) : null}
              </label>
            );
          })
        ) : (
          <EmptyState description="This event has no uploaded images yet." title="Empty gallery" />
        )}
      </div>

      <div className="drawer-actions">
        <label className="file-input">
          <input
            multiple
            onChange={(event) => onPendingFilesChange(Array.from(event.target.files ?? []))}
            type="file"
          />
          <span>{pendingFiles.length ? `Selected: ${pendingFiles.length}` : 'Select images'}</span>
        </label>
        <Button
          disabled={!pendingFiles.length || busy}
          icon={Upload}
          onClick={() => void onUpload()}
          tone="secondary"
        >
          Upload
        </Button>
        <Button
          disabled={!selectedImageIndexes.length || busy}
          icon={Trash2}
          onClick={() => void onDeleteSelected()}
          tone="danger"
        >
          Delete selected
        </Button>
      </div>

      <SectionCard
        subtitle="Read-only shortcut for the admin who configures this event."
        title="Source link"
      >
        {selectedEvent.source ? (
          /^https?:\/\//i.test(selectedEvent.source) ? (
            <a
              className="event-source-link"
              href={selectedEvent.source}
              rel="noreferrer"
              target="_blank"
            >
              <span>{selectedEvent.source}</span>
              <ExternalLink size={16} />
            </a>
          ) : (
            <div className="event-source-link event-source-link--static">
              <span>{selectedEvent.source}</span>
            </div>
          )
        ) : (
          <InlineMessage title="Source is missing" tone="warning">
            This event does not have a source URL yet.
          </InlineMessage>
        )}
      </SectionCard>
    </>
  );
};
