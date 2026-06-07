import { useState, type FormEvent } from 'react';
import { Button, Icon } from '@/components/ui';
import { useAuth } from '@/store/auth';
import type { ApiError } from '@/api/client';

const inputStyle: React.CSSProperties = {
  width: '100%',
  background: 'var(--bg-1)',
  border: '1px solid var(--line-2)',
  borderRadius: 9,
  padding: '11px 13px',
  color: 'var(--tx-0)',
  fontSize: 13.5,
  outline: 'none',
};

/** Sign-in gate. All API endpoints require a bearer token. */
export function Login() {
  const login = useAuth((s) => s.login);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    setError('');
    try {
      await login(email, password);
    } catch (err) {
      setError((err as ApiError).message || 'Giriş başarısız');
      setBusy(false);
    }
  };

  return (
    <div
      style={{
        height: '100vh',
        display: 'grid',
        placeItems: 'center',
        background: 'linear-gradient(180deg, var(--bg-1), var(--bg-0))',
      }}
    >
      <form
        onSubmit={submit}
        className="fade-up"
        style={{
          width: 360,
          display: 'flex',
          flexDirection: 'column',
          gap: 16,
          background: 'var(--panel)',
          border: '1px solid var(--line-2)',
          borderRadius: 16,
          padding: 28,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 11 }}>
          <div
            style={{
              width: 34,
              height: 34,
              borderRadius: 9,
              background: 'linear-gradient(135deg, var(--acc), #2f54c9)',
              display: 'grid',
              placeItems: 'center',
            }}
          >
            <Icon name="activity" size={19} color="#fff" strokeW={2.4} />
          </div>
          <div>
            <div style={{ fontWeight: 800, fontSize: 17, letterSpacing: '-0.02em' }}>Sentinel</div>
            <div style={{ fontSize: 12, color: 'var(--tx-3)' }}>Oturum aç</div>
          </div>
        </div>

        <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--tx-2)' }}>E-posta</span>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="admin@sentinel.dev"
            autoFocus
            style={inputStyle}
          />
        </label>

        <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--tx-2)' }}>Parola</span>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            style={inputStyle}
          />
        </label>

        {error && (
          <div
            style={{
              fontSize: 12.5,
              color: 'var(--crit)',
              background: 'var(--crit-soft)',
              border: '1px solid var(--crit-line)',
              borderRadius: 8,
              padding: '9px 11px',
            }}
          >
            {error}
          </div>
        )}

        <Button variant="primary" icon="arrowRight" style={{ justifyContent: 'center' }}>
          {busy ? 'Giriş yapılıyor…' : 'Giriş yap'}
        </Button>
      </form>
    </div>
  );
}
