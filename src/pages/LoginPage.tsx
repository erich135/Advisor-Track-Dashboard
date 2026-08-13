import { useState, type CSSProperties, type FormEvent } from 'react';
import { TrendingUp, Lock, Eye, EyeOff, Mail } from 'lucide-react';

type LoginPageProps = {
  onLogin: (email: string, password: string) => Promise<{ ok: true } | { ok: false; error: string }>;
};

export default function LoginPage({ onLogin }: LoginPageProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [show, setShow] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [shaking, setShaking] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const canSubmit = email.trim().length > 0 && password.length > 0 && !submitting;

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;

    setSubmitting(true);
    setError(null);
    const result = await onLogin(email, password);
    setSubmitting(false);

    if (!result.ok) {
      setError(result.error);
      setShaking(true);
      setPassword('');
      setTimeout(() => setShaking(false), 500);
    }
  }

  const fieldStyle = (hasError: boolean): CSSProperties => ({
    width: '100%',
    background: '#0d1117',
    border: `1px solid ${hasError ? '#cf222e' : '#30363d'}`,
    borderRadius: 8,
    padding: '10px 40px 10px 13px',
    color: '#e6edf3',
    fontSize: 14,
    outline: 'none',
    boxSizing: 'border-box',
    fontFamily: 'inherit',
    transition: 'border-color 0.15s',
  });

  return (
    <div style={{
      minHeight: '100vh',
      background: '#0d1117',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 24,
    }}>
      <div style={{
        width: '100%',
        maxWidth: 380,
        animation: shaking ? 'shake 0.45s ease' : undefined,
      }}>
        {/* Brand */}
        <div style={{ textAlign: 'center', marginBottom: 36 }}>
          <div style={{
            width: 56, height: 56, borderRadius: 14,
            background: '#1f6feb', display: 'inline-grid',
            placeItems: 'center', marginBottom: 14,
          }}>
            <TrendingUp size={26} color="#fff" />
          </div>
          <div style={{ color: '#fff', fontWeight: 700, fontSize: 22, letterSpacing: '-0.02em' }}>
            AdvisorTrack
          </div>
          <div style={{ color: '#768390', fontSize: 13.5, marginTop: 4 }}>
            Admin Console
          </div>
        </div>

        {/* Card */}
        <div style={{
          background: '#161b22',
          border: '1px solid #21262d',
          borderRadius: 14,
          padding: '28px 28px 24px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
            <Lock size={16} color="#768390" />
            <span style={{ color: '#c9d1d9', fontWeight: 600, fontSize: 14.5 }}>
              Sign in with your AdvisorTrack account
            </span>
          </div>

          <form onSubmit={submit}>
            <label style={{ display: 'block', color: '#8b949e', fontSize: 12.5, marginBottom: 6 }}>
              Email
            </label>
            <div style={{ position: 'relative', marginBottom: 14 }}>
              <input
                type="email"
                autoFocus
                autoComplete="username"
                value={email}
                onChange={(e) => { setEmail(e.target.value); setError(null); }}
                placeholder="you@company.co.za"
                style={fieldStyle(Boolean(error))}
                onFocus={(e) => {
                  if (!error) e.target.style.borderColor = '#1f6feb';
                }}
                onBlur={(e) => {
                  if (!error) e.target.style.borderColor = '#30363d';
                }}
              />
              <span
                style={{
                  position: 'absolute', right: 10, top: '50%',
                  transform: 'translateY(-50%)',
                  color: '#768390',
                  display: 'grid', placeItems: 'center',
                  pointerEvents: 'none',
                }}
              >
                <Mail size={16} />
              </span>
            </div>

            <label style={{ display: 'block', color: '#8b949e', fontSize: 12.5, marginBottom: 6 }}>
              Password
            </label>
            <div style={{ position: 'relative', marginBottom: 14 }}>
              <input
                type={show ? 'text' : 'password'}
                autoComplete="current-password"
                value={password}
                onChange={(e) => { setPassword(e.target.value); setError(null); }}
                placeholder="Password"
                style={fieldStyle(Boolean(error))}
                onFocus={(e) => {
                  if (!error) e.target.style.borderColor = '#1f6feb';
                }}
                onBlur={(e) => {
                  if (!error) e.target.style.borderColor = '#30363d';
                }}
              />
              <button
                type="button"
                onClick={() => setShow((s) => !s)}
                style={{
                  position: 'absolute', right: 10, top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none', border: 'none',
                  color: '#768390', cursor: 'pointer', padding: 2,
                  display: 'grid', placeItems: 'center',
                }}
              >
                {show ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>

            {error && (
              <div style={{ color: '#f85149', fontSize: 12.5, marginBottom: 12, display: 'flex', alignItems: 'flex-start', gap: 5 }}>
                <Lock size={12} style={{ marginTop: 2, flexShrink: 0 }} />
                <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={!canSubmit}
              style={{
                width: '100%',
                background: canSubmit ? '#1f6feb' : '#21262d',
                border: 'none',
                borderRadius: 8,
                color: canSubmit ? '#fff' : '#484f58',
                fontWeight: 600,
                fontSize: 14,
                padding: '10px 0',
                cursor: canSubmit ? 'pointer' : 'not-allowed',
                fontFamily: 'inherit',
                transition: 'background 0.15s',
              }}
            >
              {submitting ? 'Signing in…' : 'Sign in'}
            </button>
          </form>
        </div>

        <div style={{ textAlign: 'center', color: '#484f58', fontSize: 12, marginTop: 20 }}>
          Internal tool · AdvisorTrack (Pty) Ltd
        </div>
      </div>

      <style>{`
        @keyframes shake {
          0%,100% { transform: translateX(0); }
          20%      { transform: translateX(-8px); }
          40%      { transform: translateX(8px); }
          60%      { transform: translateX(-5px); }
          80%      { transform: translateX(5px); }
        }
      `}</style>
    </div>
  );
}
