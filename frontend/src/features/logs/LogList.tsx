import React, { useState } from 'react';
import { HealthLog } from '../../types';
import { getDataStore } from '../../data/dataProvider';
import { formatDateTime } from '../../lib/time';

interface LogListProps {
  logs: HealthLog[];
  onLogDeleted: () => void;
}

export const LogList: React.FC<LogListProps> = ({ logs, onLogDeleted }) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const filteredLogs = selectedCategory === 'all'
    ? logs
    : logs.filter((l) => l.category === selectedCategory);

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this recorded entry?')) return;
    setDeletingId(id);
    try {
      await getDataStore().deleteLog(id);
      onLogDeleted();
    } catch {
      alert('Failed to delete log entry.');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '8px' }}>
        <h2>Recorded Entries</h2>
        <div>
          <label htmlFor="filter-cat" className="sr-only">Filter by category</label>
          <select
            id="filter-cat"
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            style={{
              padding: '8px 12px',
              borderRadius: '8px',
              border: '1px solid var(--border)',
              backgroundColor: 'var(--surface)',
              color: 'var(--text)'
            }}
          >
            <option value="all">All Categories</option>
            <option value="medication">Medication</option>
            <option value="blood_pressure">Blood Pressure</option>
            <option value="glucose">Glucose</option>
            <option value="activity">Activity</option>
            <option value="sleep">Sleep</option>
            <option value="meal">Meal</option>
          </select>
        </div>
      </div>

      {filteredLogs.length === 0 ? (
        <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '24px 0' }}>
          No recorded entries found.
        </p>
      ) : (
        <ul style={{ listStyle: 'none' }}>
          {filteredLogs.map((log) => (
            <li
              key={log.id}
              style={{
                padding: '12px',
                borderBottom: '1px solid var(--border)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '8px'
              }}
            >
              <div>
                <span
                  style={{
                    display: 'inline-block',
                    padding: '2px 8px',
                    borderRadius: '4px',
                    backgroundColor: 'var(--surface-elevated)',
                    fontSize: '0.8rem',
                    fontWeight: 'bold',
                    textTransform: 'capitalize',
                    marginRight: '8px'
                  }}
                >
                  {log.category.replace('_', ' ')}
                </span>
                <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                  {formatDateTime(log.occurredAt)}
                </span>
                <p style={{ marginTop: '4px', color: 'var(--text)' }}>
                  {Object.entries(log.data)
                    .map(([k, v]) => `${k.replace('_', ' ')}: ${v}`)
                    .join(' • ')}
                  {log.unit && ` (${log.unit})`}
                </p>
                {log.note && (
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontStyle: 'italic', marginTop: '2px' }}>
                    Note: {log.note}
                  </p>
                )}
              </div>

              <button
                className="btn-secondary"
                onClick={() => handleDelete(log.id)}
                disabled={deletingId === log.id}
                style={{ padding: '6px 12px', fontSize: '0.85rem' }}
                aria-label={`Delete ${log.category} record`}
              >
                {deletingId === log.id ? 'Deleting...' : 'Delete'}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};
