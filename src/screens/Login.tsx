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

type Mode = 'login' | 'register';

/** Sign-in / sign-up gate. All API endpoints require a bearer token. */
export function Login() {
  const login = useAuth((s) => s.login);
  const register = useAuth((s) => s.register);
  const [mode, setMode] = useState<Mode>('login');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const isRegister = mode === 'register';

  const switchMode = (next: Mode) => {
    setMode(next);
    setError('');
  };

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    setError('');
    try {
      if (isRegister) await register(email, fullName, password);
      else await login(email, password);
    } catch (err) {
      const fallback = isRegister ? 'Kayıt başarısız' : 'Giriş başarısız';
      setError((err as ApiError).message || fallback);
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
            <div style={{ fontSize: 12, color: 'var(--tx-3)' }}>
              {isRegister ? 'Hesap oluştur' : 'Oturum aç'}
            </div>
          </div>
        </div>

        {isRegister && (
          <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--tx-2)' }}>Ad Soyad</span>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Ahmet Yılmaz"
              autoFocus
              style={inputStyle}
            />
          </label>
        )}

        <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--tx-2)' }}>E-posta</span>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="admin@sentinel.dev"
            autoFocus={!isRegister}
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
          {isRegister && (
            <span style={{ fontSize: 11.5, color: 'var(--tx-3)' }}>En az 8 karakter</span>
          )}
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
          {busy
            ? isRegister
              ? 'Hesap oluşturuluyor…'
              : 'Giriş yapılıyor…'
            : isRegister
              ? 'Hesap oluştur'
              : 'Giriş yap'}
        </Button>

        <div style={{ fontSize: 12.5, color: 'var(--tx-3)', textAlign: 'center' }}>
          {isRegister ? 'Zaten hesabın var mı? ' : 'Hesabın yok mu? '}
          <button
            type="button"
            onClick={() => switchMode(isRegister ? 'login' : 'register')}
            style={{
              background: 'none',
              border: 'none',
              padding: 0,
              color: 'var(--acc)',
              fontSize: 12.5,
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            {isRegister ? 'Giriş yap' : 'Hesap oluştur'}
          </button>
        </div>
      </form>
    </div>
  );
}
