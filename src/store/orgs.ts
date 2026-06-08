import { create } from 'zustand';
import { api } from '@/api/endpoints';
import type { ApiError } from '@/api/client';
import type { ApiOrganization } from '@/api/types';

const ACTIVE_KEY = 'sentinel_active_org';

interface OrgState {
  orgs: ApiOrganization[];
  activeId: string | null;
  loaded: boolean;
  error: string | null;
  load: () => Promise<void>;
  setActive: (id: string) => void;
  create: (name: string) => Promise<ApiOrganization>;
}

/** Holds the organizations the user belongs to and which one is currently active. */
export const useOrgs = create<OrgState>((set, get) => ({
  orgs: [],
  activeId: localStorage.getItem(ACTIVE_KEY),
  loaded: false,
  error: null,
  load: async () => {
    try {
      const orgs = await api.listOrganizations();
      const stored = localStorage.getItem(ACTIVE_KEY);
      const activeId = orgs.some((o) => o.id === stored) ? stored : (orgs[0]?.id ?? null);
      if (activeId) localStorage.setItem(ACTIVE_KEY, activeId);
      set({ orgs, activeId, loaded: true, error: null });
    } catch (e) {
      set({ loaded: true, error: (e as ApiError).message });
    }
  },
  setActive: (id) => {
    localStorage.setItem(ACTIVE_KEY, id);
    set({ activeId: id });
  },
  create: async (name) => {
    const org = await api.createOrganization({ name });
    set({ orgs: [...get().orgs, org] });
    get().setActive(org.id);
    return org;
  },
}));
