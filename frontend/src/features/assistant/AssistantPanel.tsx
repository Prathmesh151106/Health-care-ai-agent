import React, { useState } from 'react';
import { AssistantReply, AssistantDraft } from '../../types';
import { getDataStore } from '../../data/dataProvider';
import { DraftConfirmation } from './DraftConfirmation';

export const AssistantPanel: React.FC = () => {
  const [hasConsented, setHasConsented] = useState<boolean>(() => {
    return localStorage.getItem('dhc_assistant_consent') === 'true';
  });
  const [inputMessage, setInputMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [conversation, setConversation] = useState<Array<{ role: 'user' | 'assistant'; text: string; urgent?: string; drafts?: AssistantDraft[] }>>([]);

  const handleGrantConsent = () => {
    localStorage.setItem('dhc_assistant_consent', 'true');
    setHasConsented(true);
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim() || isSubmitting) return;

    const userText = inputMessage.trim();
    setInputMessage('');
    setConversation((prev) => [...prev, { role: 'user', text: userText }]);
    setIsSubmitting(true);

    try {
      const res: AssistantReply = await getDataStore().askAssistant(userText);
      setConversation((prev) => [
        ...prev,
        {
          role: 'assistant',
          text: res.reply,
          urgent: res.urgentGuidance,
          drafts: res.drafts
        }
      ]);
    } catch {
      setConversation((prev) => [
        ...prev,
        {
          role: 'assistant',
          text: 'The assistant could not process your request. Please try again later.'
        }
      ]);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!hasConsented) {
    return (
      <div className="card">
        <h2>AI Assistant</h2>
        <p style={{ margin: '12px 0', color: 'var(--text-muted)' }}>
          The assistant helps you organize entries and prepare schedules. It does not provide medical diagnoses or alter treatments.
        </p>
        <div style={{ backgroundColor: 'var(--surface-elevated)', padding: '14px', borderRadius: '8px', marginBottom: '16px' }}>
          <p style={{ fontSize: '0.9rem' }}>
            <strong>Privacy Note:</strong> When you send a message, your text and relevant dates may be securely processed by the AI provider to prepare organization drafts. Your entries are never used to train public models.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button className="btn-primary" onClick={handleGrantConsent}>
            I Understand and Agree
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
        <h2>AI Assistant</h2>
        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
          Self-management aid • Not medical advice
        </span>
      </div>

      <div
        style={{
          maxHeight: '400px',
          overflowY: 'auto',
          border: '1px solid var(--border)',
          borderRadius: '8px',
          padding: '12px',
          marginBottom: '16px',
          backgroundColor: 'var(--surface-elevated)'
        }}
      >
        {conversation.length === 0 && (
          <p style={{ color: 'var(--text-muted)', fontStyle: 'italic', textAlign: 'center', padding: '24px 0' }}>
            Ask to organize a log entry or schedule a reminder (e.g., "Add a 20 min walk" or "Remind me to take medication at 8 AM").
          </p>
        )}

        {conversation.map((msg, idx) => (
          <div
            key={idx}
            style={{
              marginBottom: '12px',
              textAlign: msg.role === 'user' ? 'right' : 'left'
            }}
          >
            {msg.urgent && (
              <div className="banner-urgent" role="alert">
                {msg.urgent}
              </div>
            )}

            <div
              style={{
                display: 'inline-block',
                maxWidth: '85%',
                padding: '10px 14px',
                borderRadius: '12px',
                backgroundColor: msg.role === 'user' ? 'var(--primary)' : 'var(--surface)',
                color: msg.role === 'user' ? '#ffffff' : 'var(--text)',
                border: msg.role === 'user' ? 'none' : '1px solid var(--border)',
                textAlign: 'left'
              }}
            >
              <p>{msg.text}</p>
            </div>

            {msg.drafts && msg.drafts.map((d, dIdx) => (
              <DraftConfirmation
                key={dIdx}
                draft={d}
                onSaved={() => {
                  alert('Saved successfully!');
                }}
                onDiscard={() => {
                  // remove draft
                }}
              />
            ))}
          </div>
        ))}
      </div>

      <form onSubmit={handleSendMessage} style={{ display: 'flex', gap: '8px' }}>
        <input
          type="text"
          value={inputMessage}
          onChange={(e) => setInputMessage(e.target.value)}
          placeholder="Type your message..."
          disabled={isSubmitting}
          style={{
            flex: 1,
            padding: '10px 14px',
            borderRadius: '8px',
            border: '1px solid var(--border)',
            backgroundColor: 'var(--surface)',
            color: 'var(--text)'
          }}
        />
        <button type="submit" className="btn-primary" disabled={isSubmitting || !inputMessage.trim()}>
          {isSubmitting ? 'Sending...' : 'Send'}
        </button>
      </form>
    </div>
  );
};
