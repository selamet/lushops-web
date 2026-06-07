import type { App, AppHealth } from '@/types';

/** CSS color token for an app's rolled-up health. */
export function appHealthColor(h: AppHealth): string {
  return h === 'crit' ? 'var(--crit)' : h === 'warn' ? 'var(--warn)' : 'var(--ok)';
}

/** Localized label for an app's rolled-up health. */
export function appHealthLabel(h: AppHealth): string {
  return h === 'crit' ? 'Kritik' : h === 'warn' ? 'Dikkat' : 'Sağlıklı';
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
