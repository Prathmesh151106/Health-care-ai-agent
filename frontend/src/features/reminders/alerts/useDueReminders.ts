import { useEffect, useState, useRef, useCallback } from 'react';
import { DueOccurrence } from '../../../types';
import { getDataStore } from '../../../data/dataProvider';

const POLL_INTERVAL_MS = 30000; // Exact 30 seconds named constant
const SESSION_STORAGE_SHOWN_KEY = 'dhc_shown_occurrence_ids';

export function useDueReminders() {
  const [dueList, setDueList] = useState<DueOccurrence[]>([]);
  const shownIdsRef = useRef<Set<string>>(new Set());

  // Restore shown IDs from sessionStorage
  useEffect(() => {
    try {
      const stored = sessionStorage.getItem(SESSION_STORAGE_SHOWN_KEY);
      if (stored) {
        const arr = JSON.parse(stored);
        if (Array.isArray(arr)) {
          shownIdsRef.current = new Set(arr);
        }
      }
    } catch {
      // Ignore sessionStorage parsing issues
    }
  }, []);

  const saveShownIds = useCallback((set: Set<string>) => {
    try {
      sessionStorage.setItem(SESSION_STORAGE_SHOWN_KEY, JSON.stringify(Array.from(set)));
    } catch {
      // Ignore
    }
  }, []);

  const checkDue = useCallback(async () => {
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      return; // Pause when offline
    }
    if (typeof document !== 'undefined' && document.hidden) {
      return; // Pause when tab is hidden
    }

    try {
      const occurrences = await getDataStore().getDueReminders();
      const newItems: DueOccurrence[] = [];

      for (const occ of occurrences) {
        if (!shownIdsRef.current.has(occ.occurrenceId)) {
          shownIdsRef.current.add(occ.occurrenceId);
          newItems.push(occ);
        }
      }

      if (newItems.length > 0) {
        saveShownIds(shownIdsRef.current);
        setDueList((prev) => [...prev, ...newItems]);
      }
    } catch {
      // Backend may be waking up or offline
    }
  }, [saveShownIds]);

  useEffect(() => {
    checkDue();

    const interval = setInterval(checkDue, POLL_INTERVAL_MS);

    const onVisibilityChange = () => {
      if (!document.hidden) {
        checkDue();
      }
    };

    const onOnline = () => {
      checkDue();
    };

    document.addEventListener('visibilitychange', onVisibilityChange);
    window.addEventListener('online', onOnline);

    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', onVisibilityChange);
      window.removeEventListener('online', onOnline);
    };
  }, [checkDue]);

  const dismissOccurrence = (occurrenceId: string) => {
    setDueList((prev) => prev.filter((o) => o.occurrenceId !== occurrenceId));
  };

  return { dueList, dismissOccurrence, refreshDue: checkDue };
}
