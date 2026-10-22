import React, { useState } from 'react';
import { LogCategory, NewHealthLog } from '../../types';
import { getDataStore } from '../../data/dataProvider';

interface QuickAddLogProps {
  onLogAdded: () => void;
}

export const QuickAddLog: React.FC<QuickAddLogProps> = ({ onLogAdded }) => {
  const [category, setCategory] = useState<LogCategory>('medication');
  const [note, setNote] = useState('');
  const [unit, setUnit] = useState('');
  const [value1, setValue1] = useState('');
  const [value2, setValue2] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    const data: Record<string, any> = {};

    if (category === 'medication') {
      data.medication_name = value1 || 'Medication';
      data.dosage = value2 || '1 dose';
    } else if (category === 'blood_pressure') {
      data.systolic = Number(value1) || 120;
      data.diastolic = Number(value2) || 80;
    } else if (category === 'glucose') {
      data.glucose_value = Number(value1) || 100;
      data.timing = value2 || 'fasting';
    } else if (category === 'activity') {
      data.activity_name = value1 || 'Activity';
      data.duration_minutes = Number(value2) || 30;
    } else if (category === 'sleep') {
      data.duration_hours = Number(value1) || 8;
    } else if (category === 'meal') {
      data.meal_type = value1 || 'breakfast';
      data.description = value2 || 'Meal description';
    }

    const payload: NewHealthLog = {
      category,
      data,
      unit: unit || undefined,
      note: note || undefined,
      occurredAt: new Date().toISOString()
    };

    try {
      await getDataStore().createLog(payload);
      setValue1('');
      setValue2('');
      setNote('');
      setUnit('');
      onLogAdded();
    } catch {
      setError('Failed to record log. Please check your inputs.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="card">
      <h2 style={{ marginBottom: '16px' }}>Quick Health Log</h2>

      <form onSubmit={handleSubmit}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px', marginBottom: '16px' }}>
          <div>
            <label htmlFor="log-category" style={{ display: 'block', fontWeight: 600, marginBottom: '4px' }}>
              Category
            </label>
            <select
              id="log-category"
              value={category}
              onChange={(e) => setCategory(e.target.value as LogCategory)}
              style={{
                width: '100%',
                padding: '10px',
                borderRadius: '8px',
                border: '1px solid var(--border)',
                backgroundColor: 'var(--surface)',
                color: 'var(--text)'
              }}
            >
              <option value="medication">Medication</option>
              <option value="blood_pressure">Blood Pressure</option>
              <option value="glucose">Glucose</option>
              <option value="activity">Activity</option>
              <option value="sleep">Sleep</option>
              <option value="meal">Meal</option>
            </select>
          </div>

          <div>
            <label htmlFor="log-val1" style={{ display: 'block', fontWeight: 600, marginBottom: '4px' }}>
              {category === 'medication' && 'Medication Name'}
              {category === 'blood_pressure' && 'Systolic (mmHg)'}
              {category === 'glucose' && 'Glucose Reading'}
              {category === 'activity' && 'Activity Type'}
              {category === 'sleep' && 'Hours Slept'}
              {category === 'meal' && 'Meal Type (e.g. Breakfast)'}
            </label>
            <input
              id="log-val1"
              type="text"
              required
              value={value1}
              onChange={(e) => setValue1(e.target.value)}
              placeholder="Enter value"
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

          {category !== 'sleep' && (
            <div>
              <label htmlFor="log-val2" style={{ display: 'block', fontWeight: 600, marginBottom: '4px' }}>
                {category === 'medication' && 'Dosage'}
                {category === 'blood_pressure' && 'Diastolic (mmHg)'}
                {category === 'glucose' && 'Timing (fasting / post-meal)'}
                {category === 'activity' && 'Duration (minutes)'}
                {category === 'meal' && 'Food Items'}
              </label>
              <input
                id="log-val2"
                type="text"
                value={value2}
                onChange={(e) => setValue2(e.target.value)}
                placeholder="Optional detail"
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
          )}

          <div>
            <label htmlFor="log-note" style={{ display: 'block', fontWeight: 600, marginBottom: '4px' }}>
              Note (optional)
            </label>
            <input
              id="log-note"
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="e.g. Taken after food"
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
          {isSubmitting ? 'Recording...' : 'Record Entry'}
        </button>
      </form>
    </div>
  );
};
