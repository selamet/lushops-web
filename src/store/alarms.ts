import { create } from 'zustand';
import { api } from '@/api/endpoints';
import { mapAlarm } from '@/api/map';
import { useFleet } from '@/store/fleet';
import type { ApiAlarm } from '@/api/types';
import type { Alarm } from '@/types';

interface AlarmsState {
  alarms: Alarm[];
  loaded: boolean;
  load: () => Promise<void>;
  refresh: () => Promise<void>;
  acknowledge: (id: string) => Promise<void>;
  resolve: (id: string) => Promise<void>;
}

/** Resolve appId/containerId to display names via the fleet lookups. */
function toAlarms(list: ApiAlarm[]): Alarm[] {
  const { appNameById, containerNameById } = useFleet.getState();
  return list.map((a) =>
    mapAlarm(
      a,
      appNameById[a.appId] ?? a.appId,
      a.containerId ? (containerNameById[a.containerId] ?? a.containerId) : '—',
    ),
  );
}

export const useAlarms = create<AlarmsState>((set, get) => ({
  alarms: [],
  loaded: false,
  load: async () => {
    try {
      set({ alarms: toAlarms(await api.listAlarms()), loaded: true });
    } catch {
      set({ loaded: true });
    }
  },
  refresh: async () => {
    try {
      set({ alarms: toAlarms(await api.listAlarms()) });
    } catch {
      // keep the last snapshot
    }
  },
  acknowledge: async (id) => {
    await api.acknowledgeAlarm(id);
    await get().refresh();
  },
  resolve: async (id) => {
    await api.resolveAlarm(id);
    await get().refresh();
  },
}));
