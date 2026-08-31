import { startTransition, useCallback, useRef, useState, type ChangeEvent } from 'react';
import { clampPage } from '../../shared/lib/utils';
import {
  EmptyState,
  InlineMessage,
  LoadingState,
  PageHeader,
  Pagination,
  SectionCard,
  ToggleTabs,
} from '../../shared/ui';
import { useSession } from '../../features/session/useSession';
import { EventDrawer } from './components/EventDrawer';
import { EventMobileCards } from './components/EventMobileCards';
import { EventsTable } from './components/EventsTable';
import { EventsToolbar } from './components/EventsToolbar';
import { ParserWorkspace } from './components/ParserWorkspace';
import { useEventCsvTransfer } from './hooks/useEventCsvTransfer';
import { useEventDrawer } from './hooks/useEventDrawer';
import { useEventsList } from './hooks/useEventsList';
import { useParserRuns } from './hooks/useParserRuns';
import type {
  EventGroup,
  ModerationMode,
  WorkspaceView,
} from './model/eventFilters';

export const EventsPage = () => {
  const { user } = useSession();
  const [workspaceView, setWorkspaceView] = useState<WorkspaceView>('events');
  const csvFileInputRef = useRef<HTMLInputElement | null>(null);

  const eventsList = useEventsList({ userName: user?.username });

  const handleAfterCreate = useCallback(() => {
    startTransition(() => {
      eventsList.setFilters((current) => ({
        ...current,
        group: 'moderation',
        moderationMode: 'requests',
        page: 1,
      }));
    });
  }, [eventsList]);

  const handleParserStarted = useCallback(async () => {
    startTransition(() => {
      eventsList.setFilters((current) => ({
        ...current,
        group: 'moderation',
        moderationMode: 'parser',
        page: 1,
      }));
    });

    await eventsList.refreshCounts();
  }, [eventsList]);

  const handleParserPollTick = useCallback(async () => {
    await eventsList.refreshCounts();

    if (eventsList.filters.group === 'moderation' && eventsList.filters.moderationMode === 'parser') {
      await eventsList.reloadList();
    }
  }, [eventsList]);

  const drawer = useEventDrawer({
    listEvents: eventsList.events,
    userName: user?.username,
    onReload: eventsList.reload,
    onAfterCreate: handleAfterCreate,
  });

  const parserRuns = useParserRuns({
    userName: user?.username,
    onError: eventsList.reportError,
    onRunStarted: handleParserStarted,
    onPollTick: handleParserPollTick,
  });

  const handleWorkspaceChange = useCallback((nextView: WorkspaceView) => {
    startTransition(() => {
      setWorkspaceView(nextView);
    });
  }, []);

  const handleGroupChange = useCallback((nextGroup: EventGroup) => {
    startTransition(() => {
      eventsList.setFilters((current) => ({
        ...current,
        group: nextGroup,
        moderationMode: nextGroup === 'moderation' ? current.moderationMode : 'all',
        page: 1,
      }));
    });
  }, [eventsList]);

  const handleModerationChange = useCallback((nextMode: ModerationMode) => {
    startTransition(() => {
      eventsList.setFilters((current) => ({
        ...current,
        moderationMode: nextMode,
        page: 1,
      }));
    });
  }, [eventsList]);

  const handleSearchChange = useCallback((value: string) => {
    startTransition(() => {
      eventsList.setFilters((current) => ({
        ...current,
        searchInput: value,
        page: 1,
      }));
    });
  }, [eventsList]);

  const handleRefresh = useCallback(() => {
    void Promise.all([eventsList.reload(), parserRuns.refresh()]);
  }, [eventsList, parserRuns]);

  const csvTransfer = useEventCsvTransfer({
    filters: eventsList.filters,
    userName: user?.username,
    onReload: eventsList.reload,
    onAfterImport: handleAfterCreate,
  });

  const handleImportClick = useCallback(() => {
    csvTransfer.clearFeedback();
    csvFileInputRef.current?.click();
  }, [csvTransfer]);

  const handleExportClick = useCallback(() => {
    void csvTransfer.exportCurrent();
  }, [csvTransfer]);

  const handleCsvFileChange = useCallback((event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';

    if (!file) {
      return;
    }

    void csvTransfer.importFile(file);
  }, [csvTransfer]);

  return (
    <>
      <PageHeader
        eyebrow="Catalog moderation"
        title="Events"
        subtitle="Manage the live catalog, review incoming changes, and monitor parser activity."
      />

      <ToggleTabs
        variant="navigation"
        items={[
          { value: 'events', label: 'Events' },
          { value: 'parser', label: 'Parser' },
        ]}
        onChange={handleWorkspaceChange}
        value={workspaceView}
      />

      {workspaceView === 'parser' ? (
        <ParserWorkspace
          activeRun={parserRuns.activeRun}
          availableCategories={parserRuns.availableCategories}
          busy={parserRuns.busy}
          cancelBusy={parserRuns.cancelBusy}
          cancelRequested={parserRuns.cancelRequested}
          currentActivity={parserRuns.currentActivity}
          displayRun={parserRuns.displayRun}
          error={parserRuns.error}
          limit={parserRuns.limit}
          limitInput={parserRuns.limitInput}
          onCancel={parserRuns.cancelActive}
          onLimitInputChange={parserRuns.setLimitInput}
          onRun={parserRuns.start}
          onSkipExistingChange={parserRuns.setSkipExisting}
          onToggleCategory={parserRuns.toggleCategory}
          progressValue={parserRuns.progressValue}
          runTiming={parserRuns.runTiming}
          selectedCategories={parserRuns.selectedCategories}
          skipExisting={parserRuns.skipExisting}
        />
      ) : null}

      {workspaceView === 'events' ? (
        <SectionCard
          subtitle={eventsList.sectionSubtitle}
          title={eventsList.sectionTitle}
        >
          <input
            accept=".csv,text/csv"
            hidden
            onChange={handleCsvFileChange}
            ref={csvFileInputRef}
            type="file"
          />

          <ToggleTabs
            variant="navigation"
            items={[
              { value: 'current', label: 'Live', count: eventsList.counts.active },
              { value: 'moderation', label: 'Moderation', count: eventsList.counts.inactive + eventsList.counts.parsed },
              { value: 'archive', label: 'Archive', count: eventsList.counts.deleted },
            ]}
            onChange={handleGroupChange}
            value={eventsList.filters.group}
          />

          {eventsList.filters.group === 'moderation' ? (
            <ToggleTabs
              items={[
                { value: 'all', label: 'All', count: eventsList.counts.inactive + eventsList.counts.parsed },
                { value: 'requests', label: 'Requests', count: eventsList.counts.inactive },
                { value: 'changes', label: 'Updates' },
                { value: 'parser', label: 'Parser', count: eventsList.counts.parsed },
              ]}
              onChange={handleModerationChange}
              value={eventsList.filters.moderationMode}
            />
          ) : null}

          <EventsToolbar
            canExport={!eventsList.loading}
            canReset={eventsList.canResetFilters}
            category={eventsList.filters.category}
            dateFrom={eventsList.filters.dateFrom}
            dateTo={eventsList.filters.dateTo}
            exporting={csvTransfer.exporting}
            importing={csvTransfer.importing}
            onCategoryChange={(value) => eventsList.setFilters((current) => ({ ...current, category: value, page: 1 }))}
            onCreate={drawer.openCreate}
            onDateFromChange={(value) => eventsList.setFilters((current) => ({ ...current, dateFrom: value, page: 1 }))}
            onDateToChange={(value) => eventsList.setFilters((current) => ({ ...current, dateTo: value, page: 1 }))}
            onExport={handleExportClick}
            onImport={handleImportClick}
            onRefresh={handleRefresh}
            onReset={eventsList.resetFilters}
            onSearchChange={handleSearchChange}
            onSizeChange={(value) => eventsList.setFilters((current) => ({ ...current, size: value, page: 1 }))}
            onSortModeChange={(value) => eventsList.setFilters((current) => ({ ...current, sortMode: value, page: 1 }))}
            onSourceFilterChange={(value) => eventsList.setFilters((current) => ({ ...current, sourceFilter: value, page: 1 }))}
            refreshing={eventsList.refreshing}
            searchInput={eventsList.filters.searchInput}
            size={eventsList.filters.size}
            sortMode={eventsList.filters.sortMode}
            sourceFilter={eventsList.filters.sourceFilter}
            sourceOptions={eventsList.sourceOptions}
          />

          {csvTransfer.feedback ? (
            <InlineMessage title={csvTransfer.feedback.title} tone={csvTransfer.feedback.tone}>
              {csvTransfer.feedback.description}
            </InlineMessage>
          ) : null}

          {eventsList.error ? (
            <InlineMessage title="Loading error" tone="danger">
              {eventsList.error}
            </InlineMessage>
          ) : null}

          {eventsList.refreshing ? (
            <InlineMessage title="Updating list" tone="info">
              Fresh events are loading in the background. The current list stays visible until the update finishes.
            </InlineMessage>
          ) : null}

          {eventsList.loading ? (
            <LoadingState label="Loading events…" />
          ) : eventsList.events.length ? (
            <>
              <EventsTable
                authorNames={eventsList.authorNames}
                events={eventsList.events}
                group={eventsList.filters.group}
                onDelete={eventsList.deleteListEvent}
                onEdit={drawer.openEvent}
                onPublish={eventsList.approveListEvent}
                refreshing={eventsList.refreshing}
                rowBusyId={eventsList.rowBusyId}
              />

              <EventMobileCards
                events={eventsList.events}
                group={eventsList.filters.group}
                onDelete={eventsList.deleteListEvent}
                onEdit={drawer.openEvent}
                onPublish={eventsList.approveListEvent}
                refreshing={eventsList.refreshing}
                rowBusyId={eventsList.rowBusyId}
              />

              {eventsList.filters.group === 'moderation' && eventsList.filters.moderationMode === 'all' ? null : (
                <Pagination
                  onPageChange={(nextPage) =>
                    eventsList.setFilters((current) => ({
                      ...current,
                      page: clampPage(nextPage, eventsList.list.totalPages),
                    }))
                  }
                  page={eventsList.list.page}
                  totalPages={eventsList.list.totalPages}
                />
              )}
            </>
          ) : (
            <EmptyState
              description="Adjust the filters, date range, or moderation view and try again."
              title="No events found"
            />
          )}
        </SectionCard>
      ) : null}

      <EventDrawer
        busy={drawer.busy}
        error={drawer.error}
        formState={drawer.formState}
        isCreatingEvent={drawer.isCreatingEvent}
        isOpen={drawer.isOpen}
        loading={drawer.loading}
        onAddDate={drawer.addDate}
        onApprove={drawer.approveSelected}
        onChange={drawer.updateForm}
        onClose={drawer.closeDrawer}
        onCoordinatesChange={drawer.setCoordinates}
        onDatePartChange={drawer.updateDatePart}
        onDelete={drawer.deleteSelected}
        onDeleteImages={drawer.deleteImages}
        onPendingFilesChange={drawer.setPendingFiles}
        onRemoveDate={drawer.removeDate}
        onSave={drawer.save}
        onToggleImageSelection={drawer.toggleSelectedImageIndex}
        onUploadImages={drawer.uploadImages}
        pendingFiles={drawer.pendingFiles}
        selectedEvent={drawer.selectedEvent}
        selectedEventId={drawer.selectedEventId}
        selectedImageIndexes={drawer.selectedImageIndexes}
        subtitle={drawer.drawerSubtitle}
        title={drawer.drawerTitle}
      />
    </>
  );
};
