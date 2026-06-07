import { useLocation, useNavigate } from 'react-router-dom';
import { Button, Eyebrow, Icon, StatusDot, type IconName } from '@/components/ui';
import { appHealthColor } from '@/lib/health';
import { paths } from '@/lib/routes';
import { useAuth } from '@/store/auth';
import type { App } from '@/types';

/** Two-letter initials from a display name. */
function initials(name: string): string {
  return name
    .split(' ')
    .map((p) => p[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

interface SidebarProps {
  apps: App[];
  activeAlarmCount: number;
}

interface NavItem {
  to: string;
  label: string;
  icon: IconName;
  badge?: number;
}

/** Left navigation rail: brand, primary action, sections and the app list. */
export function Sidebar({ apps, activeAlarmCount }: SidebarProps) {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const user = useAuth((s) => s.user);
  const logout = useAuth((s) => s.logout);

  const nav: NavItem[] = [
    { to: paths.overview(), label: 'Genel bakış', icon: 'grid' },
    { to: paths.alarms(), label: 'Alarmlar', icon: 'bell', badge: activeAlarmCount },
    { to: paths.settings(), label: 'Ayarlar', icon: 'settings' },
  ];

  return (
    <aside
      style={{
        width: 232,
        flexShrink: 0,
        display: 'flex',
        flexDirection: 'column',
        background: 'linear-gradient(180deg, var(--bg-1), var(--bg-0))',
        borderRight: '1px solid var(--line)',
      }}
    >
      <div style={{ padding: '20px 20px 18px', display: 'flex', alignItems: 'center', gap: 11 }}>
        <div
          style={{
            width: 32,
            height: 32,
            borderRadius: 9,
            background: 'linear-gradient(135deg, var(--acc), #2f54c9)',
            display: 'grid',
            placeItems: 'center',
            boxShadow: '0 4px 14px -4px var(--acc-glow)',
          }}
        >
          <Icon name="activity" size={18} color="#fff" strokeW={2.4} />
        </div>
        <div>
          <div style={{ fontWeight: 800, fontSize: 16, letterSpacing: '-0.02em' }}>Sentinel</div>
          <div
            className="mono"
            style={{
              fontSize: 9.5,
              color: 'var(--tx-3)',
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              marginTop: -1,
            }}
          >
            container monitor
          </div>
        </div>
      </div>

      <div style={{ padding: '0 12px' }}>
        <Button
          variant="primary"
          icon="plus"
          onClick={() => navigate(paths.add())}
          style={{ width: '100%', justifyContent: 'center' }}
        >
          Uygulama ekle
        </Button>
      </div>

      <nav style={{ padding: '16px 12px 10px', display: 'flex', flexDirection: 'column', gap: 3 }}>
        {nav.map((n) => {
          const active = n.to === '/' ? pathname === '/' : pathname.startsWith(n.to);
          return (
            <button
              key={n.to}
              onClick={() => navigate(n.to)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 11,
                padding: '9px 12px',
                borderRadius: 9,
                fontSize: 13.5,
                fontWeight: 600,
                color: active ? 'var(--tx-0)' : 'var(--tx-2)',
                background: active ? 'var(--panel-hi)' : 'transparent',
                border: `1px solid ${active ? 'var(--line-2)' : 'transparent'}`,
                position: 'relative',
                transition: 'all .14s',
              }}
            >
              {active && (
                <span
                  style={{
                    position: 'absolute',
                    left: 0,
                    top: 8,
                    bottom: 8,
                    width: 2.5,
                    borderRadius: 3,
                    background: 'var(--acc)',
                  }}
                />
              )}
              <Icon name={n.icon} size={17} color={active ? 'var(--acc)' : 'var(--tx-3)'} />
              <span style={{ flex: 1, textAlign: 'left' }}>{n.label}</span>
              {n.badge !== undefined && n.badge > 0 && (
                <span
                  className="mono tnum"
                  style={{
                    fontSize: 10.5,
                    fontWeight: 700,
                    padding: '1px 7px',
                    borderRadius: 999,
                    background: 'var(--crit)',
                    color: '#fff',
                  }}
                >
                  {n.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      <div style={{ padding: '10px 20px', marginTop: 4 }}>
        <Eyebrow style={{ marginBottom: 12 }}>Uygulamalar</Eyebrow>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {apps.map((a) => {
            const hc = appHealthColor(a.health);
            const active = pathname === paths.app(a.id);
            return (
              <button
                key={a.id}
                onClick={() => navigate(paths.app(a.id))}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 9,
                  padding: '7px 8px',
                  borderRadius: 7,
                  fontSize: 12.5,
                  color: active ? 'var(--tx-0)' : 'var(--tx-2)',
                  background: active ? 'var(--panel)' : 'transparent',
                  fontWeight: active ? 600 : 500,
                  textAlign: 'left',
                  transition: 'all .14s',
                }}
              >
                <StatusDot color={hc} size={7} pulse={a.health !== 'ok'} />
                <span
                  className="mono"
                  style={{
                    flex: 1,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {a.name}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <div style={{ marginTop: 'auto', padding: 14, borderTop: '1px solid var(--line)' }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            padding: '8px 10px',
            borderRadius: 9,
            background: 'var(--panel)',
          }}
        >
          <div
            style={{
              width: 30,
              height: 30,
              borderRadius: 8,
              background: 'linear-gradient(135deg, #34d399, #059669)',
              display: 'grid',
              placeItems: 'center',
              fontWeight: 700,
              fontSize: 12,
              color: '#04140d',
            }}
          >
            {user ? initials(user.fullName) : '–'}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div
              style={{
                fontSize: 12.5,
                fontWeight: 600,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {user?.fullName ?? '—'}
            </div>
            <div style={{ fontSize: 10.5, color: 'var(--tx-3)' }}>{user?.role ?? ''}</div>
          </div>
          <button onClick={logout} title="Çıkış yap" style={{ color: 'var(--tx-3)', display: 'grid', placeItems: 'center' }}>
            <Icon name="external" size={16} />
          </button>
        </div>
      </div>
    </aside>
  );
}
