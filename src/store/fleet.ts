import { create } from 'zustand';
import { api } from '@/api/endpoints';
import { mapApp, mapContainer } from '@/api/map';
import type { ApiError } from '@/api/client';
import type { App } from '@/types';

interface FleetData {
  apps: App[];
  appNameById: Record<string, string>;
  containerNameById: Record<string, string>;
}

interface FleetState extends FleetData {
  loaded: boolean;
  error: string | null;
  load: () => Promise<void>;
  refresh: () => Promise<void>;
}

/** Fetch every app with its containers and build id→name lookups for alarm display. */
async function fetchFleet(): Promise<FleetData> {
  const apiApps = await api.listApps();
  const loaded = await Promise.all(
    apiApps.map(async (a) => ({ a, containers: await api.listContainers(a.id) })),
  );

  const appNameById: Record<string, string> = {};
  const containerNameById: Record<string, string> = {};
  const apps = loaded.map(({ a, containers }) => {
    appNameById[a.id] = a.name;
    const mapped = containers.map((c) => {
      containerNameById[c.id] = c.name;
      return mapContainer(c);
    });
    return mapApp(a, mapped);
  });
  return { apps, appNameById, containerNameById };
}

/**
 * Holds the live fleet, loaded from the API. `refresh` re-polls without flipping
 * the `loaded` flag, so the UI updates in place rather than flashing a spinner.
 */
export const useFleet = create<FleetState>((set) => ({
  apps: [],
  appNameById: {},
  containerNameById: {},
  loaded: false,
  error: null,
  load: async () => {
    try {
      set({ ...(await fetchFleet()), loaded: true, error: null });
    } catch (e) {
      set({ loaded: true, error: (e as ApiError).message });
    }
  },
  refresh: async () => {
    try {
      set({ ...(await fetchFleet()), error: null });
    } catch {
      // keep the last good snapshot on a transient refresh failure
    }
  },
}));
