import React, { useState } from 'react';
import { NewReminder } from '../../types';
import { getDataStore } from '../../data/dataProvider';
import { getUserTimezone, getTodayDateString } from '../../lib/time';

interface ReminderFormProps {
  onReminderAdded: () => void;
}

export const ReminderForm: React.FC<ReminderFormProps> = ({ onReminderAdded }) => {
  const [title, setTitle] = useState('');
  const [timeOfDay, setTimeOfDay] = useState('08:00');
  const [repeatRule, setRepeatRule] = useState<'daily' | 'none'>('daily');
  const [timezone, setTimezone] = useState(getUserTimezone());
  const [note, setNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    setIsSubmitting(true);
    setError(null);

    const payload: NewReminder = {
      title: title.trim(),
      timeOfDay,
      startDate: getTodayDateString(timezone),
      timezone,
      repeatRule,
      enabled: true,
      note: note.trim() || undefined
    };

    try {
      await getDataStore().createReminder(payload);
      setTitle('');
      setNote('');
      onReminderAdded();
    } catch {
      setError('Failed to create reminder. Please check your inputs.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="card">
      <h2 style={{ marginBottom: '16px' }}>Add Reminder</h2>

      <form onSubmit={handleSubmit}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px', marginBottom: '16px' }}>
          <div>
            <label htmlFor="rem-title" style={{ display: 'block', fontWeight: 600, marginBottom: '4px' }}>
              Reminder Title
            </label>
            <input
              id="rem-title"
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Morning Medication"
              style={{
                width: '100%',
                padding: '10px',
                borderRadius: '8px',
                border: '1px solid var(--border)',
                backgroundColor: 'var(--surface)',
                color: 'var(--text)'
              }}
            />
          </div>

          <div>
            <label htmlFor="rem-time" style={{ display: 'block', fontWeight: 600, marginBottom: '4px' }}>
              Time of Day
            </label>
            <input
              id="rem-time"
              type="time"
              required
              value={timeOfDay}
              onChange={(e) => setTimeOfDay(e.target.value)}
              style={{
                width: '100%',
                padding: '10px',
                borderRadius: '8px',
                border: '1px solid var(--border)',
                backgroundColor: 'var(--surface)',
                color: 'var(--text)'
              }}
            />
          </div>

          <div>
            <label htmlFor="rem-repeat" style={{ display: 'block', fontWeight: 600, marginBottom: '4px' }}>
              Repeat
            </label>
            <select
              id="rem-repeat"
              value={repeatRule}
              onChange={(e) => setRepeatRule(e.target.value as 'daily' | 'none')}
              style={{
                width: '100%',
                padding: '10px',
                borderRadius: '8px',
                border: '1px solid var(--border)',
                backgroundColor: 'var(--surface)',
                color: 'var(--text)'
              }}
            >
              <option value="daily">Daily</option>
              <option value="none">One-time</option>
            </select>
          </div>

          <div>
            <label htmlFor="rem-tz" style={{ display: 'block', fontWeight: 600, marginBottom: '4px' }}>
              Timezone
            </label>
            <input
              id="rem-tz"
              type="text"
              value={timezone}
              onChange={(e) => setTimezone(e.target.value)}
              style={{
                width: '100%',
                padding: '10px',
                borderRadius: '8px',
                border: '1px solid var(--border)',
                backgroundColor: 'var(--surface)',
                color: 'var(--text)'
              }}
            />
          </div>
        </div>

        {error && <p style={{ color: 'var(--danger)', marginBottom: '12px' }}>{error}</p>}

        <button type="submit" className="btn-primary" disabled={isSubmitting}>
          {isSubmitting ? 'Creating...' : 'Create Reminder'}
        </button>
      </form>
    </div>
  );
};
