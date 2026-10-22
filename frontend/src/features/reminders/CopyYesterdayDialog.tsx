import React, { useState } from 'react';
import { CopyPreview } from '../../types';
import { getDataStore } from '../../data/dataProvider';
import { formatTime } from '../../lib/time';

interface CopyYesterdayDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const CopyYesterdayDialog: React.FC<CopyYesterdayDialogProps> = ({ isOpen, onClose, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState<CopyPreview | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{ created: number; skipped: number } | null>(null);

  if (!isOpen) return null;

  const handleFetchPreview = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getDataStore().previewCopyYesterday();
      setPreview(data);
    } catch {
      setError("Unable to preview yesterday's schedule. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getDataStore().confirmCopyYesterday();
      setResult(res);
      onSuccess();
    } catch {
      setError("Unable to copy yesterday's schedule. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="copy-dialog-title"
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0,0,0,0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 10000,
        padding: '16px'
      }}
    >
      <div
        className="card"
        style={{
          maxWidth: '500px',
          width: '100%',
          maxHeight: '90vh',
          overflowY: 'auto'
        }}
      >
        <h2 id="copy-dialog-title" style={{ marginBottom: '12px' }}>
          Copy Yesterday's Schedule
        </h2>

        <p style={{ color: 'var(--text-muted)', marginBottom: '16px' }}>
          This will copy your reminder times into today's schedule. Past completion marks and health logs will not be copied.
        </p>

        {!preview && !result && (
          <div>
            <button className="btn-primary" onClick={handleFetchPreview} disabled={loading}>
              {loading ? 'Checking schedule...' : 'Preview Schedule'}
            </button>
            <button className="btn-secondary" onClick={onClose} style={{ marginLeft: '8px' }}>
              Cancel
            </button>
          </div>
        )}

        {preview && !result && (
          <div>
            <div style={{ marginBottom: '16px', background: 'var(--surface-elevated)', padding: '12px', borderRadius: '8px' }}>
              <p><strong>Reminders to create:</strong> {preview.willCreate}</p>
              <p><strong>Already exist (will skip):</strong> {preview.willSkip}</p>
            </div>

            {preview.items.length > 0 && (
              <ul style={{ listStyle: 'none', marginBottom: '16px' }}>
                {preview.items.map((item, idx) => (
                  <li key={idx} style={{ padding: '6px 0', borderBottom: '1px solid var(--border)' }}>
                    <strong>{formatTime(item.timeOfDay)}</strong> — {item.title}
                  </li>
                ))}
              </ul>
            )}

            <div style={{ display: 'flex', gap: '8px' }}>
              <button className="btn-primary" onClick={handleConfirm} disabled={loading || preview.willCreate === 0}>
                {loading ? 'Copying...' : 'Confirm and Copy'}
              </button>
              <button className="btn-secondary" onClick={onClose} disabled={loading}>
                Cancel
              </button>
            </div>
          </div>
        )}

        {result && (
          <div>
            <div style={{ padding: '12px', background: 'var(--surface-elevated)', borderRadius: '8px', marginBottom: '16px' }}>
              <p style={{ color: 'var(--primary)', fontWeight: 'bold' }}>Schedule copied successfully!</p>
              <p>{result.created} reminder(s) created, {result.skipped} skipped.</p>
            </div>
            <button className="btn-primary" onClick={onClose}>
              Done
            </button>
          </div>
        )}

        {error && (
          <p style={{ color: 'var(--danger)', marginTop: '12px' }}>
            {error}
          </p>
        )}
      </div>
    </div>
  );
};
