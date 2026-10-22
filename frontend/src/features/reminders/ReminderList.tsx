import React, { useState } from 'react';
import { Reminder } from '../../types';
import { getDataStore } from '../../data/dataProvider';
import { formatTime } from '../../lib/time';

interface ReminderListProps {
  reminders: Reminder[];
  onRemindersChanged: () => void;
  onOpenCopyDialog: () => void;
}

export const ReminderList: React.FC<ReminderListProps> = ({ reminders, onRemindersChanged, onOpenCopyDialog }) => {
  const [actionId, setActionId] = useState<string | null>(null);

  const handleToggle = async (r: Reminder) => {
    setActionId(r.id);
    try {
      await getDataStore().updateReminder(r.id, { enabled: !r.enabled });
      onRemindersChanged();
    } catch {
      alert('Failed to update reminder.');
    } finally {
      setActionId(null);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete this reminder?')) return;
    setActionId(id);
    try {
      await getDataStore().deleteReminder(id);
      onRemindersChanged();
    } catch {
      alert('Failed to delete reminder.');
    } finally {
      setActionId(null);
    }
  };

  return (
    <div className="card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '8px' }}>
        <h2>Your Reminders</h2>
        <button className="btn-secondary" onClick={onOpenCopyDialog}>
          Copy Yesterday's Schedule
        </button>
      </div>

      {reminders.length === 0 ? (
        <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '24px 0' }}>
          No reminders scheduled yet. Add one above or copy yesterday's schedule.
        </p>
      ) : (
        <ul style={{ listStyle: 'none' }}>
          {reminders.map((r) => (
            <li
              key={r.id}
              style={{
                padding: '12px',
                borderBottom: '1px solid var(--border)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '8px',
                opacity: r.enabled ? 1 : 0.6
              }}
            >
              <div>
                <strong style={{ fontSize: '1.05rem', color: 'var(--text)' }}>
                  {formatTime(r.timeOfDay)}
                </strong>
                <span style={{ marginLeft: '12px', fontSize: '1rem', color: 'var(--text)' }}>
                  {r.title}
                </span>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                  Repeats: {typeof r.repeatRule === 'string' ? r.repeatRule : 'Weekly'} • TZ: {r.timezone}
                </p>
              </div>

              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  className="btn-secondary"
                  onClick={() => handleToggle(r)}
                  disabled={actionId === r.id}
                  style={{ padding: '6px 12px', fontSize: '0.85rem' }}
                >
                  {r.enabled ? 'Disable' : 'Enable'}
                </button>
                <button
                  className="btn-secondary"
                  onClick={() => handleDelete(r.id)}
                  disabled={actionId === r.id}
                  style={{ padding: '6px 12px', fontSize: '0.85rem' }}
                >
                  Delete
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};
