import React, { useEffect, useState } from 'react';
import { DueOccurrence } from '../../../types';
import { getDataStore } from '../../../data/dataProvider';
import { playReminderChime } from './sound';

interface ReminderAlertProps {
  occurrences: DueOccurrence[];
  onDismiss: (occurrenceId: string) => void;
}

export const ReminderAlert: React.FC<ReminderAlertProps> = ({ occurrences, onDismiss }) => {
  const [audioBlocked, setAudioBlocked] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const current = occurrences[0];

  useEffect(() => {
    if (current) {
      getDataStore().getPreferences().then((pref) => {
        if (pref.soundEnabled) {
          playReminderChime(pref.volume).then((success) => {
            if (!success) setAudioBlocked(true);
          });
        }
      });
    }
  }, [current]);

  if (!current) return null;

  const handleSnooze = async (minutes: number) => {
    setIsProcessing(true);
    setErrorMsg(null);
    try {
      await getDataStore().snooze(current.occurrenceId, minutes);
      onDismiss(current.occurrenceId);
    } catch {
      setErrorMsg('Failed to snooze reminder. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleComplete = async () => {
    setIsProcessing(true);
    setErrorMsg(null);
    try {
      await getDataStore().complete(current.occurrenceId);
      onDismiss(current.occurrenceId);
    } catch {
      setErrorMsg('Failed to mark reminder as completed. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div
      role="alert"
      aria-live="assertive"
      style={{
        position: 'fixed',
        bottom: '24px',
        right: '24px',
        maxWidth: '420px',
        width: 'calc(100% - 48px)',
        zIndex: 9999,
        backgroundColor: 'var(--surface)',
        border: '2px solid var(--primary)',
        boxShadow: '0 8px 24px rgba(0,0,0,0.18)',
        borderRadius: '12px',
        padding: '20px'
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '8px' }}>
        <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold', color: 'var(--text)' }}>
          Reminder Due
        </h3>
        {occurrences.length > 1 && (
          <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            + {occurrences.length - 1} more
          </span>
        )}
      </div>

      <p style={{ fontSize: '1.1rem', marginBottom: '12px', color: 'var(--text)' }}>
        {current.title}
      </p>

      {audioBlocked && (
        <p style={{ fontSize: '0.85rem', color: 'var(--accent)', marginBottom: '8px' }}>
          Sound was blocked by browser. Click anywhere to enable reminder chime.
        </p>
      )}

      {errorMsg && (
        <p style={{ color: 'var(--danger)', fontSize: '0.9rem', marginBottom: '8px' }}>
          {errorMsg}
        </p>
      )}

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '12px' }}>
        <button
          className="btn-primary"
          onClick={handleComplete}
          disabled={isProcessing}
        >
          Mark Done
        </button>
        <button
          className="btn-secondary"
          onClick={() => handleSnooze(10)}
          disabled={isProcessing}
        >
          Snooze 10m
        </button>
        <button
          className="btn-secondary"
          onClick={() => handleSnooze(30)}
          disabled={isProcessing}
        >
          Snooze 30m
        </button>
      </div>

      <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '12px' }}>
        Note: Alerts work while this app is open in your browser.
      </p>
    </div>
  );
};
