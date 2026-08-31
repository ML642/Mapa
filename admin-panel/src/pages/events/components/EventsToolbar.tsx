import { Download, Plus, RefreshCcw, RotateCcw, Search, Upload } from 'lucide-react';
import { EVENT_CATEGORIES, PAGE_SIZE_OPTIONS } from '../../../shared/constants';
import {
  formatEventCategory,
  formatSourceOptionLabel,
} from '../../../shared/lib/utils';
import {
  Badge,
  Button,
  Field,
  Input,
  Select,
} from '../../../shared/ui';
import type { SortMode } from '../model/eventFilters';

type EventsToolbarProps = {
  searchInput: string;
  category: string;
  dateFrom: string;
  dateTo: string;
  sourceFilter: string;
  sortMode: SortMode;
  size: number;
  sourceOptions: string[];
  refreshing: boolean;
  importing: boolean;
  exporting: boolean;
  canExport: boolean;
  canReset: boolean;
  onSearchChange: (value: string) => void;
  onCategoryChange: (value: string) => void;
  onDateFromChange: (value: string) => void;
  onDateToChange: (value: string) => void;
  onSourceFilterChange: (value: string) => void;
  onSortModeChange: (value: SortMode) => void;
  onSizeChange: (value: number) => void;
  onReset: () => void;
  onRefresh: () => void;
  onImport: () => void;
  onExport: () => void;
  onCreate: () => void;
};

export const EventsToolbar = ({
  searchInput,
  category,
  dateFrom,
  dateTo,
  sourceFilter,
  sortMode,
  size,
  sourceOptions,
  refreshing,
  importing,
  exporting,
  canExport,
  canReset,
  onSearchChange,
  onCategoryChange,
  onDateFromChange,
  onDateToChange,
  onSourceFilterChange,
  onSortModeChange,
  onSizeChange,
  onReset,
  onRefresh,
  onImport,
  onExport,
  onCreate,
}: EventsToolbarProps) => {
  return (
    <>
      <div className="toolbar-inline">
        {refreshing ? <Badge tone="info">Refreshing</Badge> : null}
        <Button
          disabled={!canReset}
          icon={RotateCcw}
          onClick={onReset}
          size="sm"
          tone="ghost"
        >
          Reset filters
        </Button>
        <Button icon={RefreshCcw} onClick={onRefresh} size="sm" tone="secondary">
          Refresh data
        </Button>
        <Button disabled={importing || exporting} icon={Upload} onClick={onImport} size="sm" tone="secondary">
          {importing ? 'Importing CSV…' : 'Import CSV'}
        </Button>
        <Button
          disabled={!canExport || importing || exporting}
          icon={Download}
          onClick={onExport}
          size="sm"
          tone="secondary"
        >
          {exporting ? 'Exporting CSV…' : 'Export CSV'}
        </Button>
        <Button icon={Plus} onClick={onCreate} size="sm">
          Custom event
        </Button>
      </div>

      <div className="toolbar-grid">
        <Field label="Search">
          <div className="input-with-icon">
            <Search size={16} />
            <Input
              onChange={(event) => onSearchChange(event.target.value)}
              placeholder="Title, description, address…"
              value={searchInput}
            />
          </div>
        </Field>

        <Field label="Page size">
          <Select onChange={(event) => onSizeChange(Number(event.target.value))} value={size}>
            {PAGE_SIZE_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </Select>
        </Field>

        <Field label="Category">
          <Select onChange={(event) => onCategoryChange(event.target.value)} value={category}>
            <option value="">All categories</option>
            {EVENT_CATEGORIES.map((item) => (
              <option key={item} value={item}>
                {formatEventCategory(item)}
              </option>
            ))}
          </Select>
        </Field>

        <Field label="Date from">
          <Input
            onChange={(event) => onDateFromChange(event.target.value)}
            type="date"
            value={dateFrom}
          />
        </Field>

        <Field label="Date to">
          <Input
            onChange={(event) => onDateToChange(event.target.value)}
            type="date"
            value={dateTo}
          />
        </Field>

        <Field label="Source">
          <Select onChange={(event) => onSourceFilterChange(event.target.value)} value={sourceFilter}>
            {sourceOptions.map((option) => (
              <option key={option} value={option}>
                {option === 'all' ? 'All sources' : formatSourceOptionLabel(option)}
              </option>
            ))}
          </Select>
        </Field>

        <Field label="Sort">
          <Select onChange={(event) => onSortModeChange(event.target.value as SortMode)} value={sortMode}>
            <option value="newest">Newest first</option>
            <option value="oldest">Oldest first</option>
            <option value="title">Title</option>
          </Select>
        </Field>
      </div>
    </>
  );
};
