import { create } from 'zustand';
import { APPS } from '@/data/apps';
import { clamp } from '@/lib/series';
import type { App, Container } from '@/types';

/** Apply a small random walk to one container's live metrics. */
function jitterContainer(c: Container): Container {
  if (c.status === 'exited') return c;
  const j = (base: number, amp: number, lo: number, hi: number) =>
    clamp(+(base + (Math.random() - 0.5) * amp).toFixed(1), lo, hi);
  const cpu = j(c.cpu, c.cpu * 0.12 + 1.5, 0, 100);
  const memPct = j(c.memPct, 2, 0, 100);
  const net = j(c.net, c.net * 0.2 + 0.3, 0, 999);
  return {
    ...c,
    cpu,
    memPct,
    net,
    mem: Math.round((c.memLimit * memPct) / 100),
    cpuSeries: [...c.cpuSeries.slice(1), cpu],
    memSeries: [...c.memSeries.slice(1), memPct],
    netSeries: [...c.netSeries.slice(1), net],
  };
}

interface FleetState {
  apps: App[];
  /** Advance every container's live metrics by one step. */
  tick: () => void;
}

/**
 * Holds the live fleet. `tick` simulates streaming metrics; in production this
 * store would be fed by a WebSocket or polling layer instead.
 */
export const useFleet = create<FleetState>((set) => ({
  apps: structuredClone(APPS),
  tick: () =>
    set((s) => ({
      apps: s.apps.map((app) => ({
        ...app,
        containers: app.containers.map(jitterContainer),
      })),
    })),
}));
