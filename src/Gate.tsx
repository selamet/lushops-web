import { useEffect } from 'react';
import { App } from './App';
import { Login } from './screens/Login';
import { useAuth } from './store/auth';

/** Decides between the sign-in screen and the app shell based on session status. */
export function Gate() {
  const status = useAuth((s) => s.status);
  const bootstrap = useAuth((s) => s.bootstrap);

  useEffect(() => {
    bootstrap();
  }, [bootstrap]);

  if (status === 'loading') {
    return (
      <div style={{ height: '100vh', display: 'grid', placeItems: 'center', background: 'var(--bg-0)', color: 'var(--tx-3)' }}>
        Yükleniyor…
      </div>
    );
  }
  if (status === 'anon') return <Login />;
  return <App />;
}
