import { lazy, Suspense } from 'react';
import { EVENT_CATEGORIES } from '../../../shared/constants';
import { formatEventCategory } from '../../../shared/lib/utils';
import {
  Field,
  Input,
  LoadingState,
  Select,
  TextArea,
} from '../../../shared/ui';
import type {
  EventCoordinates,
  EventFormState,
} from '../model/eventForm';
import { EventDatesEditor } from './EventDatesEditor';

const EventLocationPicker = lazy(async () => {
  const module = await import('../../../features/events/EventLocationPicker');
  return { default: module.EventLocationPicker };
});

type EventFormProps = {
  formState: EventFormState;
  selectedEventId: string | null;
  onChange: (patch: Partial<EventFormState>) => void;
  onCoordinatesChange: (coordinates: EventCoordinates) => void;
  onDatePartChange: (index: number, part: 'date' | 'time', value: string) => void;
  onAddDate: () => void;
  onRemoveDate: (index: number) => void;
};

export const EventForm = ({
  formState,
  selectedEventId,
  onChange,
  onCoordinatesChange,
  onDatePartChange,
  onAddDate,
  onRemoveDate,
}: EventFormProps) => {
  return (
    <div className="form-grid">
      <Field label="Title">
        <Input
          onChange={(event) => onChange({ title: event.target.value })}
          value={formState.title}
        />
      </Field>

      <Field label="Category">
        <Select
          onChange={(event) => onChange({ category: event.target.value })}
          value={formState.category}
        >
          {EVENT_CATEGORIES.map((item) => (
            <option key={item} value={item}>
              {formatEventCategory(item)}
            </option>
          ))}
        </Select>
      </Field>

      <Field label="Phone">
        <Input
          onChange={(event) => onChange({ phone: event.target.value })}
          value={formState.phone}
        />
      </Field>

      <Field label="Price">
        <div className="input-with-suffix">
          <Input
            className="input-with-suffix__input"
            onChange={(event) => onChange({ price: event.target.value })}
            type="number"
            value={formState.price}
          />
          <span className="input-with-suffix__label">PLN</span>
        </div>
      </Field>

      <Field label="Price note">
        <Input
          onChange={(event) => onChange({ price_description: event.target.value })}
          value={formState.price_description}
        />
      </Field>

      <Field label="Premium">
        <label className="checkbox">
          <input
            checked={formState.is_premium}
            onChange={(event) => onChange({ is_premium: event.target.checked })}
            type="checkbox"
          />
          <span>Feature this event as premium</span>
        </label>
      </Field>

      <div className="form-grid__full">
        <Field hint="Use separate date and time fields for each event slot." label="Event dates">
          <EventDatesEditor
            dates={formState.dates}
            eventKey={selectedEventId ?? 'event'}
            onAddDate={onAddDate}
            onDatePartChange={onDatePartChange}
            onRemoveDate={onRemoveDate}
          />
        </Field>
      </div>

      <div className="form-grid__full">
        <Field label="Description">
          <TextArea
            onChange={(event) => onChange({ description: event.target.value })}
            rows={5}
            value={formState.description}
          />
        </Field>
      </div>

      <div className="form-grid__full">
        <Field label="Address">
          <Input
            onChange={(event) => onChange({ address: event.target.value })}
            value={formState.address}
          />
        </Field>
      </div>

      <div className="form-grid__full">
        <Field
          hint="The point updates automatically from the address. Moving the marker changes only coordinates."
          label="Location"
        >
          <Suspense fallback={<LoadingState label="Loading map tools…" />}>
            <EventLocationPicker
              key={selectedEventId ?? 'location-picker'}
              address={formState.address}
              onChange={onCoordinatesChange}
              value={formState.coordinates}
            />
          </Suspense>
        </Field>
      </div>
    </div>
  );
};
