import React, { useState } from 'react';
import { useAuth } from './AuthProvider';

interface SignInPageProps {
  onDismiss: () => void;
}

export const SignInPage: React.FC<SignInPageProps> = ({ onDismiss }) => {
  const { signInWithGoogle, signInWithEmail, enterDemoMode } = useAuth();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleGoogle = async () => {
    setLoading(true);
    setError(null);
    try {
      await signInWithGoogle();
    } catch {
      setError('Unable to initiate Google sign-in. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setLoading(true);
    setError(null);
    setMessage(null);

    const res = await signInWithEmail(email.trim());
    if (res.error) {
      setError(res.error.message || 'Could not send sign-in link.');
    } else {
      setMessage(res.message || 'Sign-in link sent to your email!');
    }
    setLoading(false);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="signin-heading"
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
          maxWidth: '440px',
          width: '100%',
          padding: '28px'
        }}
      >
        <h2 id="signin-heading" style={{ marginBottom: '8px', textAlign: 'center' }}>
          Sign In
        </h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', textAlign: 'center', marginBottom: '20px' }}>
          Sync your logs, reminders, and preferences across devices securely.
        </p>

        {error && (
          <div className="banner-urgent" role="alert" style={{ fontSize: '0.9rem', padding: '10px' }}>
            {error}
          </div>
        )}

        {message && (
          <div style={{ backgroundColor: 'var(--surface-elevated)', padding: '12px', borderRadius: '8px', marginBottom: '16px', color: 'var(--primary)' }}>
            {message}
          </div>
        )}

        <button
          className="btn-secondary"
          onClick={handleGoogle}
          disabled={loading}
          style={{ width: '100%', marginBottom: '16px', justifyContent: 'center' }}
        >
          Continue with Google
        </button>

        <div style={{ textAlign: 'center', margin: '16px 0', position: 'relative' }}>
          <hr style={{ borderColor: 'var(--border)' }} />
          <span style={{ position: 'relative', top: '-12px', background: 'var(--surface)', padding: '0 8px', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            or with email
          </span>
        </div>

        <form onSubmit={handleEmail}>
          <label htmlFor="signin-email" className="sr-only">Email address</label>
          <input
            id="signin-email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="name@example.com"
            disabled={loading}
            style={{
              width: '100%',
              padding: '12px',
              borderRadius: '8px',
              border: '1px solid var(--border)',
              backgroundColor: 'var(--surface)',
              color: 'var(--text)',
              marginBottom: '12px'
            }}
          />
          <button type="submit" className="btn-primary" disabled={loading || !email.trim()} style={{ width: '100%', justifyContent: 'center' }}>
            {loading ? 'Sending link...' : 'Send Magic Link'}
          </button>
        </form>

        <div style={{ marginTop: '20px', textAlign: 'center' }}>
          <button
            className="btn-secondary"
            onClick={() => {
              enterDemoMode();
              onDismiss();
            }}
            style={{ width: '100%', border: 'none', background: 'transparent', textDecoration: 'underline' }}
          >
            Continue in demo mode (no account needed)
          </button>
        </div>
      </div>
    </div>
  );
};
