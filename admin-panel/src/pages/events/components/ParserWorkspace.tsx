import { Play } from 'lucide-react';
import { formatEventCategory } from '../../../shared/lib/utils';
import {
  Badge,
  Button,
  EmptyState,
  Input,
  InlineMessage,
  SectionCard,
} from '../../../shared/ui';
import {
  formatParserPhase,
  getParserDuplicatePolicyLabel,
} from '../hooks/useParserRuns';
import type { ParserRunRecord } from '../../../shared/types';

type ParserWorkspaceProps = {
  busy: boolean;
  activeRun: ParserRunRecord | null;
  displayRun: ParserRunRecord | null;
  error: string;
  cancelBusy: boolean;
  cancelRequested: boolean;
  availableCategories: readonly string[];
  selectedCategories: string[];
  limit: number;
  limitInput: string;
  skipExisting: boolean;
  progressValue: number;
  runTiming: string;
  currentActivity: string;
  onToggleCategory: (value: string) => void;
  onLimitInputChange: (value: string) => void;
  onSkipExistingChange: (value: boolean) => void;
  onRun: () => void | Promise<void>;
  onCancel: () => void | Promise<void>;
};

const getParserRunScopeLabel = (run: ParserRunRecord) => {
  const categories = Array.isArray(run.categories) ? run.categories.filter(Boolean) : [];

  if (!categories.length && run.mode === 'full') {
    return 'All categories';
  }

  if (categories.length === 1) {
    return `Category: ${formatEventCategory(categories[0])}`;
  }

  if (categories.length > 1) {
    return `${categories.length} categories`;
  }

  return run.category ? `Category: ${formatEventCategory(run.category)}` : 'All categories';
};

export const ParserWorkspace = ({
  busy,
  activeRun,
  displayRun,
  error,
  cancelBusy,
  cancelRequested,
  availableCategories,
  selectedCategories,
  limit,
  limitInput,
  skipExisting,
  progressValue,
  runTiming,
  currentActivity,
  onToggleCategory,
  onLimitInputChange,
  onSkipExistingChange,
  onRun,
  onCancel,
}: ParserWorkspaceProps) => {
  return (
    <SectionCard
      subtitle="Choose categories, set the target event count, and monitor the live parser run without leaving the Events page."
      title="Parser workspace"
    >
      <div className="parser-panel">
        <section className="parser-panel__hero">
          <div className="parser-panel__hero-copy">
            <span className="parser-panel__eyebrow">Relax source control</span>
            <h3>{busy ? formatParserPhase(displayRun?.progress.phase) : 'Configure next launch'}</h3>
            <p>
              {busy
                ? 'The worker is already active. You can monitor progress here and stop the current run if needed.'
                : 'Select only the categories you want, set the desired event count, and launch the next parsing session.'}
            </p>
          </div>

          <div className="parser-panel__hero-side">
            <div className="parser-panel__hero-badges">
              <Badge tone={busy ? 'accent' : 'neutral'}>
                {busy ? 'Run active' : 'Ready'}
              </Badge>
              {cancelRequested ? <Badge tone="warning">Stop requested</Badge> : null}
              <Badge tone={skipExisting ? 'info' : 'warning'}>
                {getParserDuplicatePolicyLabel(skipExisting)}
              </Badge>
            </div>

            <div className="parser-panel__hero-actions">
              <Button disabled={busy} icon={Play} onClick={() => void onRun()}>
                Start parser
              </Button>
              <Button
                disabled={!activeRun || cancelBusy || cancelRequested}
                onClick={() => void onCancel()}
                tone="ghost"
              >
                {cancelBusy ? 'Stopping...' : cancelRequested ? 'Stop requested' : 'Stop active run'}
              </Button>
            </div>
          </div>
        </section>

        {error ? (
          <InlineMessage title="Parser error" tone="danger">
            {error}
          </InlineMessage>
        ) : null}

        <div className="parser-panel__workspace">
          <section className="parser-panel__selection">
            <div className="parser-panel__section-head">
              <div>
                <strong>Category selection</strong>
                <span>
                  Leave every checkbox empty to scan all Relax categories, or mark one or several categories to narrow the run.
                </span>
              </div>
            </div>

            <div className="parser-category-grid">
              {availableCategories.map((item) => {
                const checked = selectedCategories.includes(item);

                return (
                  <label
                    className={`parser-category-chip${checked ? ' parser-category-chip--active' : ''}`}
                    key={item}
                  >
                    <input
                      checked={checked}
                      onChange={() => onToggleCategory(item)}
                      type="checkbox"
                    />
                    <span>{formatEventCategory(item)}</span>
                  </label>
                );
              })}
            </div>
          </section>

          <aside className="parser-panel__aside">
            <div className="parser-panel__count-card">
              <span>Desired event count</span>
              <strong>{limit}</strong>
              <Input
                min={1}
                onChange={(event) => onLimitInputChange(event.target.value)}
                type="number"
                value={limitInput}
              />
            </div>

            <label className="parser-panel__toggle">
              <div>
                <strong>Skip existing source links</strong>
                <span>
                  {skipExisting
                    ? 'Known links are removed before event pages are opened.'
                    : 'Existing links stay in the queue so the parser can revisit them.'}
                </span>
              </div>
              <input
                checked={skipExisting}
                onChange={(event) => onSkipExistingChange(event.target.checked)}
                type="checkbox"
              />
            </label>
          </aside>
        </div>

        <div className="parser-panel__monitor-grid">
          <section className="parser-panel__monitor-card">
            <div className="parser-panel__section-head">
              <div>
                <strong>Live snapshot</strong>
                <span>{displayRun ? runTiming : 'No parser run has been started yet.'}</span>
              </div>
            </div>

            {displayRun ? (
              <div className="parser-panel__snapshot">
                <div className="parser-panel__snapshot-primary">
                  <span>Progress</span>
                  <strong>{progressValue}%</strong>
                  <p>{formatParserPhase(displayRun.progress.phase)}</p>
                  <div className="parser-panel__meter">
                    <span style={{ width: `${progressValue}%` }} />
                  </div>
                </div>

                <div className="parser-panel__snapshot-grid">
                  <div className="parser-panel__mini-card">
                    <span>Processed</span>
                    <strong>{`${displayRun.progress.completed}/${displayRun.progress.total || displayRun.progress.discovered || 0}`}</strong>
                    <p>{currentActivity}</p>
                  </div>
                  <div className="parser-panel__mini-card">
                    <span>Scope</span>
                    <strong>{getParserRunScopeLabel(displayRun)}</strong>
                    <p>{getParserDuplicatePolicyLabel(displayRun.skipExisting)}</p>
                  </div>
                  <div className="parser-panel__mini-card">
                    <span>Discovery</span>
                    <strong>{displayRun.progress.discovered ?? 0}</strong>
                    <p>{`${displayRun.progress.skippedExisting ?? 0} skipped existing`}</p>
                  </div>
                </div>
              </div>
            ) : (
              <EmptyState
                description="Launch a parser run to populate live progress and discovery metrics."
                title="No live snapshot yet"
              />
            )}
          </section>
        </div>
      </div>
    </SectionCard>
  );
};
