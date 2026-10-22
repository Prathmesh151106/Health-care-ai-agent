import React, { useEffect, useState, useCallback } from 'react';
import { useAuth } from './auth/AuthProvider';
import { onColdStartStatusChange } from './lib/apiClient';
import { env } from './config/env';
import { getDataStore } from './data/dataProvider';
import { HealthLog, Reminder } from './types';
import { QuickAddLog } from './features/logs/QuickAddLog';
import { LogList } from './features/logs/LogList';
import { ReminderForm } from './features/reminders/ReminderForm';
import { ReminderList } from './features/reminders/ReminderList';
import { ReminderAlert } from './features/reminders/alerts/ReminderAlert';
import { useDueReminders } from './features/reminders/alerts/useDueReminders';
import { CopyYesterdayDialog } from './features/reminders/CopyYesterdayDialog';
import { AssistantPanel } from './features/assistant/AssistantPanel';
import { SummariesView } from './features/summaries/SummariesView';
import { PreferencesPage } from './features/preferences/PreferencesPage';
import { SignInPage } from './auth/SignInPage';

export const App: React.FC = () => {
  const { user, isDemoUser, signOut } = useAuth();
  const [activeTab, setActiveTab] = useState<'dashboard' | 'logs' | 'reminders' | 'assistant' | 'summaries' | 'settings'>('dashboard');
  const [isColdStart, setIsColdStart] = useState(false);
  const [showSignInModal, setShowSignInModal] = useState(false);
  const [showCopyDialog, setShowCopyDialog] = useState(false);

  const [logs, setLogs] = useState<HealthLog[]>([]);
  const [reminders, setReminders] = useState<Reminder[]>([]);

  const { dueList, dismissOccurrence } = useDueReminders();

  useEffect(() => {
    return onColdStartStatusChange((status) => {
      setIsColdStart(status);
    });
  }, []);

  const loadData = useCallback(async () => {
    try {
      const store = getDataStore();
      const logsRes = await store.listLogs();
      const remRes = await store.listReminders();
      setLogs(logsRes.items);
      setReminders(remRes);
    } catch {
      // Offline or network error
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData, user]);

  return (
    <>
      <a href="#main-content" className="skip-link">Skip to main content</a>

      {isColdStart && (
        <div className="banner-cold-start" role="status">
          <span>Waking up the server, this can take up to a minute...</span>
          <button
            className="btn-secondary"
            onClick={() => setIsColdStart(false)}
            style={{ padding: '4px 8px', fontSize: '0.8rem' }}
          >
            Dismiss
          </button>
        </div>
      )}

      <header
        style={{
          backgroundColor: 'var(--surface)',
          borderBottom: '1px solid var(--border)',
          padding: '12px 16px'
        }}
      >
        <div
          style={{
            maxWidth: '1000px',
            margin: '0 auto',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '12px'
          }}
        >
          <div>
            <h1 style={{ fontSize: '1.4rem', fontWeight: 'bold', color: 'var(--text)' }}>
              Daily Health Companion
            </h1>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              Self-management aid • Not medical advice
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            {env.isDemoMode || isDemoUser ? (
              <>
                <span
                  style={{
                    backgroundColor: 'var(--surface-elevated)',
                    border: '1px solid var(--border)',
                    padding: '4px 10px',
                    borderRadius: '16px',
                    fontSize: '0.85rem',
                    fontWeight: 600
                  }}
                >
                  Demo mode
                </span>
                {env.hasSupabase && (
                  <button className="btn-primary" onClick={() => setShowSignInModal(true)}>
                    Sign In
                  </button>
                )}
              </>
            ) : (
              <>
                <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                  {user?.email}
                </span>
                <button className="btn-secondary" onClick={() => signOut()}>
                  Sign Out
                </button>
              </>
            )}
          </div>
        </div>

        <nav
          aria-label="Main Navigation"
          style={{
            maxWidth: '1000px',
            margin: '12px auto 0 auto',
            display: 'flex',
            gap: '8px',
            flexWrap: 'wrap'
          }}
        >
          {(['dashboard', 'logs', 'reminders', 'assistant', 'summaries', 'settings'] as const).map((tab) => (
            <button
              key={tab}
              className={activeTab === tab ? 'btn-primary' : 'btn-secondary'}
              onClick={() => setActiveTab(tab)}
              style={{ textTransform: 'capitalize' }}
            >
              {tab}
            </button>
          ))}
        </nav>
      </header>

      <main id="main-content" className="app-container">
        {activeTab === 'dashboard' && (
          <div>
            <QuickAddLog onLogAdded={loadData} />
            <ReminderList
              reminders={reminders}
              onRemindersChanged={loadData}
              onOpenCopyDialog={() => setShowCopyDialog(true)}
            />
            <LogList logs={logs.slice(0, 5)} onLogDeleted={loadData} />
          </div>
        )}

        {activeTab === 'logs' && (
          <div>
            <QuickAddLog onLogAdded={loadData} />
            <LogList logs={logs} onLogDeleted={loadData} />
          </div>
        )}

        {activeTab === 'reminders' && (
          <div>
            <ReminderForm onReminderAdded={loadData} />
            <ReminderList
              reminders={reminders}
              onRemindersChanged={loadData}
              onOpenCopyDialog={() => setShowCopyDialog(true)}
            />
          </div>
        )}

        {activeTab === 'assistant' && <AssistantPanel />}

        {activeTab === 'summaries' && <SummariesView />}

        {activeTab === 'settings' && <PreferencesPage />}
      </main>

      <ReminderAlert occurrences={dueList} onDismiss={dismissOccurrence} />

      <CopyYesterdayDialog
        isOpen={showCopyDialog}
        onClose={() => setShowCopyDialog(false)}
        onSuccess={() => {
          loadData();
          setShowCopyDialog(false);
        }}
      />

      {showSignInModal && <SignInPage onDismiss={() => setShowSignInModal(false)} />}
    </>
  );
};
