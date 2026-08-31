import { useCallback, useMemo, useState } from 'react';
import {
  approveEvent,
  createEventForModeration,
  deleteEvent,
  deleteEventImages,
  fetchEventById,
  rejectParserReview,
  updateEvent,
  uploadEventImages,
} from '../../../features/events/api';
import { appendAuditRecord } from '../../../shared/lib/audit';
import {
  formatEventCategory,
  formatEventStatus,
  normalizeErrorMessage,
} from '../../../shared/lib/utils';
import type { EventItem } from '../../../shared/types';
import {
  buildEventSavePayload,
  createEmptyEventFormState,
  eventToFormState,
  isParserReviewEvent,
  NEW_EVENT_ID,
  removeEventDateAt,
  type EventCoordinates,
  type EventFormState,
  updateEventDateTimePart,
} from '../model/eventForm';

type UseEventDrawerParams = {
  listEvents: EventItem[];
  userName?: string;
  onReload: () => Promise<void>;
  onAfterCreate?: () => void;
};

type UseEventDrawerResult = {
  isOpen: boolean;
  isCreatingEvent: boolean;
  selectedEventId: string | null;
  selectedEvent: EventItem | null;
  formState: EventFormState | null;
  loading: boolean;
  busy: boolean;
  error: string;
  pendingFiles: File[];
  selectedImageIndexes: string[];
  drawerTitle: string;
  drawerSubtitle: string;
  openEvent: (input: EventItem | string) => Promise<void>;
  openCreate: () => void;
  closeDrawer: () => void;
  updateForm: (patch: Partial<EventFormState>) => void;
  setCoordinates: (coordinates: EventCoordinates) => void;
  updateDatePart: (index: number, part: 'date' | 'time', value: string) => void;
  addDate: () => void;
  removeDate: (index: number) => void;
  setPendingFiles: (files: File[]) => void;
  toggleSelectedImageIndex: (index: string, checked: boolean) => void;
  save: () => Promise<void>;
  approveSelected: () => Promise<void>;
  deleteSelected: () => Promise<void>;
  uploadImages: () => Promise<void>;
  deleteImages: () => Promise<void>;
};

export const useEventDrawer = ({
  listEvents,
  userName,
  onReload,
  onAfterCreate,
}: UseEventDrawerParams): UseEventDrawerResult => {
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<EventItem | null>(null);
  const [formState, setFormState] = useState<EventFormState | null>(null);
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  const [selectedImageIndexes, setSelectedImageIndexes] = useState<string[]>([]);

  const closeDrawer = useCallback(() => {
    setSelectedEventId(null);
    setSelectedEvent(null);
    setFormState(null);
    setLoading(false);
    setBusy(false);
    setError('');
    setPendingFiles([]);
    setSelectedImageIndexes([]);
  }, []);

  const openCreate = useCallback(() => {
    setSelectedEventId(NEW_EVENT_ID);
    setSelectedEvent(null);
    setFormState(createEmptyEventFormState());
    setLoading(false);
    setBusy(false);
    setError('');
    setPendingFiles([]);
    setSelectedImageIndexes([]);
  }, []);

  const openEvent = useCallback(async (input: EventItem | string) => {
    const currentEvent = typeof input === 'string' ? listEvents.find((event) => event._id === input) ?? null : input;
    const eventId = typeof input === 'string' ? input : input._id;

    setSelectedEventId(eventId);
    setLoading(true);
    setError('');
    setPendingFiles([]);
    setSelectedImageIndexes([]);

    try {
      const fetchedEvent = await fetchEventById(eventId);
      const mergedEvent: EventItem = {
        ...currentEvent,
        ...fetchedEvent,
        event_dates: currentEvent?.event_dates ?? fetchedEvent.event_dates,
        source: currentEvent?.source ?? fetchedEvent.source,
        status: currentEvent?.status ?? fetchedEvent.status,
        createdBy: currentEvent?.createdBy ?? fetchedEvent.createdBy,
        updatedBy: currentEvent?.updatedBy ?? fetchedEvent.updatedBy,
      };

      setSelectedEvent(mergedEvent);
      setFormState(eventToFormState(mergedEvent));
    } catch (openError) {
      if (currentEvent) {
        setSelectedEvent(currentEvent);
        setFormState(eventToFormState(currentEvent));
        setError(normalizeErrorMessage(openError, 'Failed to open event'));
      } else {
        setError(normalizeErrorMessage(openError, 'Failed to open event'));
      }
    } finally {
      setLoading(false);
    }
  }, [listEvents]);

  const updateForm = useCallback((patch: Partial<EventFormState>) => {
    setFormState((current) => current ? { ...current, ...patch } : current);
  }, []);

  const setCoordinates = useCallback((coordinates: EventCoordinates) => {
    setFormState((current) => current ? { ...current, coordinates } : current);
  }, []);

  const updateDatePart = useCallback((index: number, part: 'date' | 'time', value: string) => {
    setFormState((current) => {
      if (!current) {
        return current;
      }

      return {
        ...current,
        dates: updateEventDateTimePart(current.dates, index, part, value),
      };
    });
  }, []);

  const addDate = useCallback(() => {
    setFormState((current) => current ? { ...current, dates: [...current.dates, ''] } : current);
  }, []);

  const removeDate = useCallback((index: number) => {
    setFormState((current) => {
      if (!current) {
        return current;
      }

      return {
        ...current,
        dates: removeEventDateAt(current.dates, index),
      };
    });
  }, []);

  const toggleSelectedImageIndex = useCallback((index: string, checked: boolean) => {
    setSelectedImageIndexes((current) =>
      checked
        ? [...current, index]
        : current.filter((value) => value !== index),
    );
  }, []);

  const save = useCallback(async () => {
    if (!selectedEventId || !formState) {
      return;
    }

    setBusy(true);
    setError('');
    let createdEventId: string | null = null;

    try {
      const payload = buildEventSavePayload(formState, selectedEvent?.coordinates);

      if (selectedEventId === NEW_EVENT_ID) {
        const created = await createEventForModeration({
          title: payload.title,
          description: payload.description,
          address: payload.address,
          category: payload.category,
          coordinates: payload.coordinates,
          event_dates: payload.event_dates,
          is_premium: payload.is_premium,
          price: payload.price,
        });
        createdEventId = created._id;

        await updateEvent(created._id, payload);

        appendAuditRecord({
          actor: userName ?? 'admin',
          action: 'Custom event created',
          target: payload.title,
          details: created._id,
          status: 'success',
        });

        onAfterCreate?.();
        await Promise.all([openEvent(created._id), onReload()]);
        return;
      }

      await updateEvent(selectedEventId, payload);

      appendAuditRecord({
        actor: userName ?? 'admin',
        action: 'Event updated',
        target: formState.title,
        details: selectedEventId,
        status: 'success',
      });

      await Promise.all([openEvent(selectedEventId), onReload()]);
    } catch (saveError) {
      const message = normalizeErrorMessage(saveError, 'Failed to save changes');

      if (createdEventId) {
        await Promise.allSettled([openEvent(createdEventId), onReload()]);
        setError(`Event created, but some fields failed to sync. ${message}`);
      } else {
        setError(message);
      }
    } finally {
      setBusy(false);
    }
  }, [formState, onAfterCreate, onReload, openEvent, selectedEvent?.coordinates, selectedEventId, userName]);

  const approveSelected = useCallback(async () => {
    if (!selectedEventId || !selectedEvent) {
      return;
    }

    setBusy(true);
    setError('');

    try {
      await approveEvent(selectedEventId);
      const parserReview = isParserReviewEvent(selectedEvent);

      appendAuditRecord({
        actor: userName ?? 'admin',
        action: parserReview ? 'Parser review approved' : 'Event published',
        target: selectedEvent.title,
        details: selectedEventId,
        status: 'success',
      });

      closeDrawer();
      await onReload();
    } catch (approveError) {
      setError(normalizeErrorMessage(approveError, 'Failed to publish event'));
    } finally {
      setBusy(false);
    }
  }, [closeDrawer, onReload, selectedEvent, selectedEventId, userName]);

  const deleteSelected = useCallback(async () => {
    if (!selectedEventId || !selectedEvent) {
      return;
    }

    const parserReview = isParserReviewEvent(selectedEvent);
    setBusy(true);
    setError('');

    try {
      if (parserReview) {
        await rejectParserReview(selectedEventId);
      } else {
        await deleteEvent(selectedEventId);
      }

      appendAuditRecord({
        actor: userName ?? 'admin',
        action: parserReview ? 'Parser review rejected' : 'Event deleted',
        target: selectedEvent.title,
        details: selectedEventId,
        status: 'success',
      });

      closeDrawer();
      await onReload();
    } catch (deleteError) {
      setError(
        normalizeErrorMessage(
          deleteError,
          parserReview ? 'Failed to reject parser review' : 'Failed to delete event',
        ),
      );
    } finally {
      setBusy(false);
    }
  }, [closeDrawer, onReload, selectedEvent, selectedEventId, userName]);

  const uploadImages = useCallback(async () => {
    if (!selectedEventId || !pendingFiles.length) {
      return;
    }

    setBusy(true);
    setError('');

    try {
      await uploadEventImages(selectedEventId, pendingFiles);

      appendAuditRecord({
        actor: userName ?? 'admin',
        action: 'Images uploaded',
        target: selectedEvent?.title ?? selectedEventId,
        status: 'success',
      });

      setPendingFiles([]);
      await Promise.all([openEvent(selectedEventId), onReload()]);
    } catch (uploadError) {
      setError(normalizeErrorMessage(uploadError, 'Failed to upload images'));
    } finally {
      setBusy(false);
    }
  }, [onReload, openEvent, pendingFiles, selectedEvent?.title, selectedEventId, userName]);

  const deleteImages = useCallback(async () => {
    if (!selectedEventId || !selectedImageIndexes.length) {
      return;
    }

    setBusy(true);
    setError('');

    try {
      await deleteEventImages(selectedEventId, selectedImageIndexes);

      appendAuditRecord({
        actor: userName ?? 'admin',
        action: 'Images deleted',
        target: selectedEvent?.title ?? selectedEventId,
        details: selectedImageIndexes.join(', '),
        status: 'success',
      });

      setSelectedImageIndexes([]);
      await Promise.all([openEvent(selectedEventId), onReload()]);
    } catch (deleteImagesError) {
      setError(normalizeErrorMessage(deleteImagesError, 'Failed to delete images'));
    } finally {
      setBusy(false);
    }
  }, [onReload, openEvent, selectedEvent?.title, selectedEventId, selectedImageIndexes, userName]);

  const selectedSummary = useMemo(() => {
    if (!selectedEvent) {
      return '';
    }

    return `${formatEventCategory(selectedEvent.category)} · ${formatEventStatus(selectedEvent.status)} · ${selectedEvent._id}`;
  }, [selectedEvent]);

  return {
    isOpen: Boolean(selectedEventId),
    isCreatingEvent: selectedEventId === NEW_EVENT_ID,
    selectedEventId,
    selectedEvent,
    formState,
    loading,
    busy,
    error,
    pendingFiles,
    selectedImageIndexes,
    drawerTitle: selectedEventId === NEW_EVENT_ID ? 'New custom event' : selectedEvent?.title ?? 'Event details',
    drawerSubtitle: selectedEventId === NEW_EVENT_ID ? 'Manual event draft' : selectedSummary,
    openEvent,
    openCreate,
    closeDrawer,
    updateForm,
    setCoordinates,
    updateDatePart,
    addDate,
    removeDate,
    setPendingFiles,
    toggleSelectedImageIndex,
    save,
    approveSelected,
    deleteSelected,
    uploadImages,
    deleteImages,
  };
};
