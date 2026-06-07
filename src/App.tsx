import { useEffect, useRef, useState } from 'react';
import { Route, Routes, matchPath, useLocation } from 'react-router-dom';
import { CommandPalette } from '@/components/overlays/CommandPalette';
import { OverlayHost } from '@/components/overlays/OverlayHost';
import { CriticalBanner, Sidebar, Topbar } from '@/components/layout';
import { ALARMS } from '@/data/alarms';
import { useFleet } from '@/store/fleet';
import type { App as AppModel } from '@/types';
import { AddApp } from '@/screens/AddApp';
import { Alarms } from '@/screens/Alarms';
import { AppDetail } from '@/screens/AppDetail';
import { ContainerDetail } from '@/screens/ContainerDetail';
import { IncidentDetail } from '@/screens/IncidentDetail';
import { NotFound } from '@/screens/NotFound';
import { Overview } from '@/screens/Overview';
import { Settings } from '@/screens/Settings';

const TICK_MS = 2200;

/** Derive the topbar title from the current route and live fleet data. */
function pageTitle(pathname: string, apps: AppModel[]): string {
  if (pathname === '/') return 'Genel bakış';
  if (pathname === '/alarms') return 'Alarmlar';
  if (pathname === '/settings') return 'Ayarlar';
  if (pathname === '/add') return 'Uygulama ekle';
  if (matchPath('/incident/:id', pathname)) return 'Olay detayı';

  const cm = matchPath('/app/:id/container/:cid', pathname);
  if (cm) {
    const app = apps.find((a) => a.id === cm.params.id);
    const c = app?.containers.find((x) => x.id === cm.params.cid);
    return c?.name || 'Container';
  }
  const am = matchPath('/app/:id', pathname);
  if (am) {
    const app = apps.find((a) => a.id === am.params.id);
    return app?.name || 'Uygulama';
  }
  return 'Sentinel';
}

export function App() {
  const apps = useFleet((s) => s.apps);
  const tick = useFleet((s) => s.tick);
  const { pathname } = useLocation();
  const mainRef = useRef<HTMLElement>(null);

  const [cmdOpen, setCmdOpen] = useState(false);
  const [bannerDismissed, setBannerDismissed] = useState(false);

  const activeAll = ALARMS.filter((a) => a.state === 'active');
  const activeCrit = activeAll.filter((a) => a.sev === 'critical');
  const showBanner = activeCrit.length > 0 && !bannerDismissed && pathname !== '/alarms';

  // Live metric simulation.
  useEffect(() => {
    const t = setInterval(tick, TICK_MS);
    return () => clearInterval(t);
  }, [tick]);

  // ⌘K / Ctrl+K toggles the command palette.
  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setCmdOpen((o) => !o);
      }
    };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, []);

  // Reset scroll on navigation.
  useEffect(() => {
    mainRef.current?.scrollTo(0, 0);
  }, [pathname]);

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', background: 'var(--bg-0)' }}>
      <Sidebar apps={apps} activeAlarmCount={activeAll.length} />

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        <Topbar
          title={pageTitle(pathname, apps)}
          activeAlarms={activeAll}
          onOpenCommand={() => setCmdOpen(true)}
        />

        {showBanner && (
          <CriticalBanner alarms={activeCrit} onDismiss={() => setBannerDismissed(true)} />
        )}

        <main ref={mainRef} style={{ flex: 1, overflow: 'auto', padding: '26px' }}>
          <div style={{ maxWidth: 1320, margin: '0 auto' }}>
            <Routes>
              <Route path="/" element={<Overview />} />
              <Route path="/app/:id" element={<AppDetail />} />
              <Route path="/app/:id/container/:cid" element={<ContainerDetail />} />
              <Route path="/alarms" element={<Alarms />} />
              <Route path="/incident/:id" element={<IncidentDetail />} />
              <Route path="/add" element={<AddApp />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </div>
        </main>
      </div>

      <CommandPalette open={cmdOpen} onClose={() => setCmdOpen(false)} apps={apps} />
      <OverlayHost />
    </div>
  );
}
