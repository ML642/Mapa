import { Minus, Plus } from 'lucide-react';
import { splitDateTimeInput } from '../model/eventForm';
import { Button, Field, Input } from '../../../shared/ui';

type EventDatesEditorProps = {
  dates: string[];
  eventKey: string;
  onDatePartChange: (index: number, part: 'date' | 'time', value: string) => void;
  onAddDate: () => void;
  onRemoveDate: (index: number) => void;
};

export const EventDatesEditor = ({
  dates,
  eventKey,
  onDatePartChange,
  onAddDate,
  onRemoveDate,
}: EventDatesEditorProps) => {
  return (
    <div className="event-dates-editor">
      {dates.map((value, index) => (
        <div className="event-date-row" key={`${eventKey}-date-${index}`}>
          <div className="event-date-row__index">{index + 1}</div>
          <div className="event-date-row__fields">
            <Field label="Date">
              <Input
                onChange={(event) => onDatePartChange(index, 'date', event.target.value)}
                type="date"
                value={splitDateTimeInput(value).date}
              />
            </Field>
            <Field label="Time">
              <Input
                onChange={(event) => onDatePartChange(index, 'time', event.target.value)}
                step={60}
                type="time"
                value={splitDateTimeInput(value).time}
              />
            </Field>
          </div>
          <Button
            className="event-date-row__action"
            disabled={dates.length === 1}
            icon={Minus}
            onClick={() => onRemoveDate(index)}
            size="sm"
            tone="ghost"
          >
            Remove
          </Button>
        </div>
      ))}

      <Button icon={Plus} onClick={onAddDate} size="sm" tone="secondary">
        Add date
      </Button>
    </div>
  );
};
