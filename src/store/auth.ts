import { create } from 'zustand';
import { api } from '@/api/endpoints';
import { getToken, setToken } from '@/api/client';
import type { ApiUser } from '@/api/types';

type AuthStatus = 'loading' | 'authed' | 'anon';

interface AuthState {
  status: AuthStatus;
  user: ApiUser | null;
  bootstrap: () => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, fullName: string, password: string) => Promise<void>;
  logout: () => void;
}

/** Holds the session: token lives in localStorage, the user profile in memory. */
export const useAuth = create<AuthState>((set) => ({
  status: 'loading',
  user: null,
  bootstrap: async () => {
    if (!getToken()) {
      set({ status: 'anon', user: null });
      return;
    }
    try {
      const user = await api.me();
      set({ status: 'authed', user });
    } catch {
      setToken(null);
      set({ status: 'anon', user: null });
    }
  },
  login: async (email, password) => {
    const { accessToken } = await api.login(email, password);
    setToken(accessToken);
    const user = await api.me();
    set({ status: 'authed', user });
  },
  register: async (email, fullName, password) => {
    await api.register(email, fullName, password);
    const { accessToken } = await api.login(email, password);
    setToken(accessToken);
    const user = await api.me();
    set({ status: 'authed', user });
  },
  logout: () => {
    setToken(null);
    set({ status: 'anon', user: null });
  },
}));

window.addEventListener('auth:expired', () => useAuth.setState({ status: 'anon', user: null }));
