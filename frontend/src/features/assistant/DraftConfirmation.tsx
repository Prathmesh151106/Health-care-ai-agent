import React, { useState } from 'react';
import { AssistantDraft, NewHealthLog, NewReminder } from '../../types';
import { getDataStore } from '../../data/dataProvider';
import { formatTime } from '../../lib/time';

interface DraftConfirmationProps {
  draft: AssistantDraft;
  onSaved: () => void;
  onDiscard: () => void;
}

export const DraftConfirmation: React.FC<DraftConfirmationProps> = ({ draft, onSaved, onDiscard }) => {
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSave = async () => {
    setIsSaving(true);
    setError(null);
    try {
      if (draft.type === 'log') {
        await getDataStore().createLog(draft.payload as NewHealthLog);
      } else {
        await getDataStore().createReminder(draft.payload as NewReminder);
      }
      onSaved();
    } catch {
      setError('Could not save draft. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div
      style={{
        border: '2px dashed var(--accent)',
        borderRadius: '10px',
        padding: '16px',
        margin: '12px 0',
        backgroundColor: 'var(--surface-elevated)'
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
        <span style={{ fontSize: '0.8rem', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--accent)' }}>
          DRAFT • Not yet saved
        </span>
        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
          {draft.type === 'log' ? 'Health Log' : 'Reminder'}
        </span>
      </div>

      {draft.type === 'log' ? (
        <div>
          <p><strong>Category:</strong> {draft.payload.category}</p>
          <p><strong>Details:</strong> {JSON.stringify(draft.payload.data)}</p>
          {draft.payload.unit && <p><strong>Unit:</strong> {draft.payload.unit}</p>}
        </div>
      ) : (
        <div>
          <p><strong>Title:</strong> {draft.payload.title}</p>
          <p><strong>Time:</strong> {formatTime(draft.payload.timeOfDay)}</p>
          <p><strong>Repeat:</strong> {typeof draft.payload.repeatRule === 'string' ? draft.payload.repeatRule : 'Weekly'}</p>
        </div>
      )}

      {error && <p style={{ color: 'var(--danger)', fontSize: '0.85rem', marginTop: '6px' }}>{error}</p>}

      <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
        <button className="btn-primary" onClick={handleSave} disabled={isSaving}>
          {isSaving ? 'Saving...' : 'Save to Records'}
        </button>
        <button className="btn-secondary" onClick={onDiscard} disabled={isSaving}>
          Discard
        </button>
      </div>
    </div>
  );
};
