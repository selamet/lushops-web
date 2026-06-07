import { create } from 'zustand';
import type { IconName } from '@/components/ui';
import type { Container } from '@/types';

export type ToastType = 'info' | 'success' | 'warn' | 'error';

export interface Toast {
  id: string;
  msg: string;
  type: ToastType;
  sub?: string;
}

export interface ToastOptions {
  type?: ToastType;
  sub?: string;
  duration?: number;
}

export interface ConfirmConfig {
  title: string;
  desc?: string;
  cmd?: string;
  confirmLabel?: string;
  confirmIcon?: IconName;
  icon?: IconName;
  danger?: boolean;
  onConfirm?: () => void;
}

interface OverlayState {
  toasts: Toast[];
  modal: ConfirmConfig | null;
  terminal: Container | null;
  toast: (msg: string, opts?: ToastOptions) => void;
  dismissToast: (id: string) => void;
  confirmAction: (cfg: ConfirmConfig) => void;
  closeModal: () => void;
  openTerminal: (c: Container | null) => void;
}

/**
 * Global store for transient overlays — toasts, the confirm modal and the
 * exec terminal. Accessible from outside React via `useOverlay.getState()`,
 * which lets non-component helpers (e.g. containerAction) trigger them.
 */
export const useOverlay = create<OverlayState>((set, get) => ({
  toasts: [],
  modal: null,
  terminal: null,
  toast: (msg, opts = {}) => {
    const id = 't' + Math.random().toString(36).slice(2);
    set((s) => ({ toasts: [...s.toasts, { id, msg, type: opts.type || 'info', sub: opts.sub }] }));
    setTimeout(() => get().dismissToast(id), opts.duration || 3800);
  },
  dismissToast: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
  confirmAction: (cfg) => set({ modal: cfg }),
  closeModal: () => set({ modal: null }),
  openTerminal: (c) => set({ terminal: c }),
}));
