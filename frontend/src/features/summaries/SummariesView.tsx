import React, { useEffect, useState } from 'react';
import { Summary } from '../../types';
import { getDataStore } from '../../data/dataProvider';
import { formatDateTime } from '../../lib/time';

export const SummariesView: React.FC = () => {
  const [kind, setKind] = useState<'daily' | 'weekly' | 'appointment'>('daily');
  const [summary, setSummary] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    getDataStore()
      .getSummary(kind)
      .then((data) => setSummary(data))
      .catch(() => setSummary(null))
      .finally(() => setLoading(false));
  }, [kind]);

  const handlePrint = () => {
    window.print();
  };

  const handleCopy = () => {
    if (!summary) return;
    const text = `Daily Health Companion - Summary (${summary.kind})\n` +
      `Date Range: ${summary.dateRange.from} to ${summary.dateRange.to}\n` +
      `Total Logged Entries: ${summary.totalLogs}\n` +
      `Categories: ${JSON.stringify(summary.categoryCounts, null, 2)}\n\n` +
      `${summary.disclaimer}`;
    navigator.clipboard.writeText(text);
    alert('Summary copied to clipboard!');
  };

  return (
    <div className="card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '8px' }}>
        <h2>Health Summaries</h2>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button className="btn-secondary" onClick={handleCopy} disabled={!summary}>
            Copy Text
          </button>
          <button className="btn-secondary" onClick={handlePrint} disabled={!summary}>
            Print / Save PDF
          </button>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
        <button
          className={kind === 'daily' ? 'btn-primary' : 'btn-secondary'}
          onClick={() => setKind('daily')}
        >
          Today
        </button>
        <button
          className={kind === 'weekly' ? 'btn-primary' : 'btn-secondary'}
          onClick={() => setKind('weekly')}
        >
          Past 7 Days
        </button>
        <button
          className={kind === 'appointment' ? 'btn-primary' : 'btn-secondary'}
          onClick={() => setKind('appointment')}
        >
          Appointment Prep
        </button>
      </div>

      {loading ? (
        <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '24px 0' }}>
          Preparing summary...
        </p>
      ) : summary ? (
        <div style={{ backgroundColor: 'var(--surface-elevated)', padding: '16px', borderRadius: '8px' }}>
          <p style={{ fontWeight: 600, marginBottom: '8px' }}>
            Total Recorded Entries: {summary.totalLogs}
          </p>

          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '16px' }}>
            {Object.entries(summary.categoryCounts).map(([cat, count]) => (
              <span
                key={cat}
                style={{
                  background: 'var(--surface)',
                  padding: '6px 12px',
                  borderRadius: '6px',
                  border: '1px solid var(--border)',
                  fontSize: '0.9rem'
                }}
              >
                <strong>{cat.replace('_', ' ')}:</strong> {count}
              </span>
            ))}
          </div>

          {summary.logs && summary.logs.length > 0 && (
            <div style={{ marginBottom: '16px' }}>
              <h3 style={{ fontSize: '1rem', marginBottom: '8px' }}>Recent Entries</h3>
              <ul style={{ listStyle: 'none' }}>
                {summary.logs.map((l) => (
                  <li key={l.id} style={{ fontSize: '0.9rem', padding: '4px 0', borderBottom: '1px solid var(--border)' }}>
                    {formatDateTime(l.occurredAt)} • <strong>{l.category.replace('_', ' ')}</strong>: {JSON.stringify(l.data)}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontStyle: 'italic', marginTop: '12px' }}>
            {summary.disclaimer}
          </p>
        </div>
      ) : (
        <p style={{ color: 'var(--text-muted)' }}>No summary data available.</p>
      )}
    </div>
  );
};
