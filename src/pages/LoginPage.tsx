import { useState, type FormEvent } from 'react';
import { TrendingUp, Lock, Eye, EyeOff } from 'lucide-react';

export default function LoginPage({ onAttempt }: { onAttempt: (pin: string) => boolean }) {
  const [value, setValue] = useState('');
  const [show, setShow] = useState(false);
  const [error, setError] = useState(false);
  const [shaking, setShaking] = useState(false);

  function submit(e: FormEvent) {
    e.preventDefault();
    const ok = onAttempt(value);
    if (!ok) {
      setError(true);
      setShaking(true);
      setValue('');
      setTimeout(() => setShaking(false), 500);
    }
  }

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
              Enter access password
            </span>
          </div>

          <form onSubmit={submit}>
            <div style={{ position: 'relative', marginBottom: 14 }}>
              <input
                type={show ? 'text' : 'password'}
                autoFocus
                value={value}
                onChange={(e) => { setValue(e.target.value); setError(false); }}
                placeholder="Password"
                style={{
                  width: '100%',
                  background: '#0d1117',
                  border: `1px solid ${error ? '#cf222e' : '#30363d'}`,
                  borderRadius: 8,
                  padding: '10px 40px 10px 13px',
                  color: '#e6edf3',
                  fontSize: 14,
                  outline: 'none',
                  boxSizing: 'border-box',
                  fontFamily: 'inherit',
                  transition: 'border-color 0.15s',
                }}
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
              <div style={{ color: '#f85149', fontSize: 12.5, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 5 }}>
                <Lock size={12} /> Incorrect password — try again.
              </div>
            )}

            <button
              type="submit"
              disabled={!value.trim()}
              style={{
                width: '100%',
                background: value.trim() ? '#1f6feb' : '#21262d',
                border: 'none',
                borderRadius: 8,
                color: value.trim() ? '#fff' : '#484f58',
                fontWeight: 600,
                fontSize: 14,
                padding: '10px 0',
                cursor: value.trim() ? 'pointer' : 'not-allowed',
                fontFamily: 'inherit',
                transition: 'background 0.15s',
              }}
            >
              Sign in
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
