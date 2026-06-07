import type { App, AppHealth } from '@/types';

/** CSS color token for an app's rolled-up health. */
export function appHealthColor(h: AppHealth): string {
  return h === 'crit' ? 'var(--crit)' : h === 'warn' ? 'var(--warn)' : 'var(--ok)';
}

/** Localized label for an app's rolled-up health. */
export function appHealthLabel(h: AppHealth): string {
  return h === 'crit' ? 'Kritik' : h === 'warn' ? 'Dikkat' : 'Sağlıklı';
}

/** Soft background token for an app's health. */
export function appHealthSoft(h: AppHealth): string {
  return h === 'crit' ? 'var(--crit-soft)' : h === 'warn' ? 'var(--warn-soft)' : 'var(--ok-soft)';
}

/** Border token for an app's health. */
export function appHealthLine(h: AppHealth): string {
  return h === 'crit' ? 'var(--crit-line)' : h === 'warn' ? 'var(--warn-line)' : 'var(--ok-line)';
}

/** Pulse glow color for an app's health (used by StatusDot). */
export function appHealthGlow(h: AppHealth): string {
  return h === 'crit'
    ? 'rgba(245,85,109,0.5)'
    : h === 'warn'
      ? 'rgba(251,191,36,0.5)'
      : 'rgba(52,211,153,0.5)';
}

export interface StatusCounts {
  running: number;
  restarting: number;
  exited: number;
  unhealthy: number;
  [key: string]: number;
}

/** Count containers by effective status, treating unhealthy-but-running separately. */
export function countStatuses(app: App): StatusCounts {
  const o: StatusCounts = { running: 0, restarting: 0, exited: 0, unhealthy: 0 };
  app.containers.forEach((c) => {
    if (c.status === 'running' && c.health === 'unhealthy') o.unhealthy++;
    else o[c.status] = (o[c.status] || 0) + 1;
  });
  return o;
}
