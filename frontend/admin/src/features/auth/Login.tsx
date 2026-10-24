import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Lock, Mail, AlertCircle, ShieldCheck } from 'lucide-react';
import { useAuth } from '../../lib/auth';

export const Login: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const from = (location.state as any)?.from?.pathname || '/';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await login({ email, password });
      navigate(from, { replace: true });
    } catch (err: any) {
      setError(err?.message || 'Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="cms-app" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', padding: '1.5rem' }}>
      <div style={{ maxWidth: '420px', width: '100%' }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div
            style={{
              width: '54px',
              height: '54px',
              borderRadius: 'var(--cms-radius-lg)',
              background: 'linear-gradient(135deg, var(--cms-amber), #ea580c)',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#000',
              fontWeight: 800,
              fontSize: '1.6rem',
              marginBottom: '1rem',
              boxShadow: '0 8px 24px rgba(245, 158, 11, 0.3)',
            }}
          >
            G
          </div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 800, margin: '0 0 0.4rem 0', letterSpacing: '-0.02em' }}>
            Guna CMS
          </h2>
          <p style={{ color: 'var(--cms-text-muted)', fontSize: '0.875rem', margin: 0 }}>
            Sign in to manage your portfolio content
          </p>
        </div>

        <div className="cms-card" style={{ padding: '2rem', boxShadow: 'var(--cms-shadow-lg)' }}>
          {error && (
            <div className="cms-alert cms-alert-danger">
              <AlertCircle size={18} style={{ flexShrink: 0, marginTop: '2px' }} />
              <div>{error}</div>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="cms-form-group">
              <label className="cms-label" htmlFor="email">
                Email Address
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  id="email"
                  type="email"
                  className="cms-input"
                  style={{ paddingLeft: '2.4rem' }}
                  placeholder="admin@gunasai.in"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                  autoFocus
                />
                <Mail
                  size={16}
                  style={{
                    position: 'absolute',
                    left: '0.85rem',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: 'var(--cms-text-muted)',
                  }}
                />
              </div>
            </div>

            <div className="cms-form-group" style={{ marginBottom: '1.75rem' }}>
              <label className="cms-label" htmlFor="password">
                Password
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  id="password"
                  type="password"
                  className="cms-input"
                  style={{ paddingLeft: '2.4rem' }}
                  placeholder="••••••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                />
                <Lock
                  size={16}
                  style={{
                    position: 'absolute',
                    left: '0.85rem',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: 'var(--cms-text-muted)',
                  }}
                />
              </div>
            </div>

            <button
              type="submit"
              className="cms-btn cms-btn-primary"
              style={{ width: '100%', padding: '0.75rem', fontSize: '0.95rem' }}
              disabled={loading}
            >
              {loading ? (
                <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                  <span
                    className="cms-loading-pulse-dot"
                    style={{ width: '8px', height: '8px', backgroundColor: '#000', boxShadow: 'none' }}
                  ></span>
                  Connecting &amp; Waking Server...
                </span>
              ) : (
                'Sign In to Dashboard'
              )}
            </button>
          </form>

          <div
            style={{
              marginTop: '1.5rem',
              paddingTop: '1.25rem',
              borderTop: '1px solid var(--cms-border)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
              color: 'var(--cms-text-muted)',
              fontSize: '0.75rem',
            }}
          >
            <ShieldCheck size={14} style={{ color: 'var(--cms-teal)' }} />
            <span>Argon2id Protected • Anti-CSRF Verified</span>
          </div>
        </div>
      </div>
    </div>
  );
};
