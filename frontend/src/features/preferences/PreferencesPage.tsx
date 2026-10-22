import React, { useState } from 'react';
import { useTheme } from '../theme/ThemeProvider';
import { Preferences } from '../types';
import { playReminderChime } from '../features/reminders/alerts/sound';
import { getDataStore } from '../data/dataProvider';

export const PreferencesPage: React.FC = () => {
  const { theme, textSize, simpleLanguage, setTheme, setTextSize, setSimpleLanguage } = useTheme();
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [volume, setVolume] = useState(0.7);
  const [isImporting, setIsImporting] = useState(false);
  const [importResult, setImportResult] = useState<string | null>(null);

  const handleTestSound = () => {
    playReminderChime(volume);
  };

  const handleImport = async () => {
    if (!window.confirm('Import your local demo data into your signed-in account?')) return;
    setIsImporting(true);
    setImportResult(null);
    try {
      const res = await getDataStore().importLocalData();
      setImportResult(`Successfully imported ${res.logs} logs and ${res.reminders} reminders.`);
    } catch {
      setImportResult('Failed to import local data. Please make sure you are signed in.');
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <div className="card">
      <h2 style={{ marginBottom: '16px' }}>Settings & Accessibility</h2>

      <div style={{ display: 'grid', gap: '20px', maxWidth: '600px' }}>
        <div>
          <label htmlFor="pref-theme" style={{ display: 'block', fontWeight: 600, marginBottom: '6px' }}>
            Color Theme
          </label>
          <select
            id="pref-theme"
            value={theme}
            onChange={(e) => setTheme(e.target.value as Preferences['theme'])}
            style={{
              width: '100%',
              padding: '10px',
              borderRadius: '8px',
              border: '1px solid var(--border)',
              backgroundColor: 'var(--surface)',
              color: 'var(--text)'
            }}
          >
            <option value="calm-blue">Calm Blue</option>
            <option value="nature-green">Nature Green</option>
            <option value="warm-sunset">Warm Sunset</option>
            <option value="high-contrast">High Contrast</option>
          </select>
        </div>

        <div>
          <label htmlFor="pref-size" style={{ display: 'block', fontWeight: 600, marginBottom: '6px' }}>
            Text Size
          </label>
          <select
            id="pref-size"
            value={textSize}
            onChange={(e) => setTextSize(e.target.value as Preferences['textSize'])}
            style={{
              width: '100%',
              padding: '10px',
              borderRadius: '8px',
              border: '1px solid var(--border)',
              backgroundColor: 'var(--surface)',
              color: 'var(--text)'
            }}
          >
            <option value="standard">Standard</option>
            <option value="large">Large</option>
            <option value="extra-large">Extra Large</option>
          </select>
        </div>

        <div>
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={simpleLanguage}
              onChange={(e) => setSimpleLanguage(e.target.checked)}
              style={{ width: '20px', height: '20px' }}
            />
            <span style={{ fontWeight: 600 }}>Simple-language Mode</span>
          </label>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '4px' }}>
            Uses clearer, concise language throughout the app.
          </p>
        </div>

        <div>
          <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '8px' }}>Reminder Sound</h3>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <input
                type="checkbox"
                checked={soundEnabled}
                onChange={(e) => setSoundEnabled(e.target.checked)}
                style={{ width: '20px', height: '20px' }}
              />
              <span>Enable Sound Chime</span>
            </label>
            <button className="btn-secondary" onClick={handleTestSound} style={{ padding: '6px 14px' }}>
              Test Sound
            </button>
          </div>
          <div style={{ marginTop: '8px' }}>
            <label htmlFor="vol-slider" style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              Volume: {Math.round(volume * 100)}%
            </label>
            <input
              id="vol-slider"
              type="range"
              min="0.1"
              max="1.0"
              step="0.05"
              value={volume}
              onChange={(e) => setVolume(parseFloat(e.target.value))}
              style={{ width: '100%', display: 'block', marginTop: '4px' }}
            />
          </div>
        </div>

        <div style={{ borderTop: '1px solid var(--border)', paddingTop: '16px' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '8px' }}>Import Local Data</h3>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '12px' }}>
            Migrate logs and reminders recorded on this browser into your account database.
          </p>
          <button className="btn-secondary" onClick={handleImport} disabled={isImporting}>
            {isImporting ? 'Importing...' : 'Import to Account'}
          </button>
          {importResult && (
            <p style={{ fontSize: '0.9rem', color: 'var(--primary)', marginTop: '8px' }}>
              {importResult}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};
