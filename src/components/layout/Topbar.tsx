import { useState } from 'react';
import { Icon, StatusDot } from '@/components/ui';
import type { Alarm } from '@/types';
import { AlarmDropdown } from './AlarmDropdown';

interface TopbarProps {
  title: string;
  activeAlarms: Alarm[];
  onOpenCommand: () => void;
}

/** Top bar: page title, live indicator, ⌘K trigger and the notification bell. */
export function Topbar({ title, activeAlarms, onOpenCommand }: TopbarProps) {
  const [alarmsOpen, setAlarmsOpen] = useState(false);

  return (
    <header
      style={{
        height: 60,
        flexShrink: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 26px',
        borderBottom: '1px solid var(--line)',
        background: 'var(--bg-0)',
        position: 'relative',
        zIndex: 20,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, minWidth: 0 }}>
        <h2
          style={{
            margin: 0,
            fontSize: 16.5,
            fontWeight: 700,
            letterSpacing: '-0.01em',
            whiteSpace: 'nowrap',
          }}
        >
          {title}
        </h2>
        <span
          className="mono"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            fontSize: 11.5,
            color: 'var(--tx-3)',
            whiteSpace: 'nowrap',
            flexShrink: 0,
          }}
        >
          <StatusDot color="var(--ok)" size={6} pulse glow="rgba(52,211,153,0.0)" />
          canlı · 30s
        </span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div
          onClick={onOpenCommand}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            background: 'var(--panel)',
            border: '1px solid var(--line-2)',
            borderRadius: 9,
            padding: '7px 12px',
            width: 230,
            cursor: 'pointer',
          }}
        >
          <Icon name="search" size={15} color="var(--tx-3)" />
          <span style={{ flex: 1, color: 'var(--tx-3)', fontSize: 12.5 }}>
            App, container, image ara…
          </span>
          <span
            className="mono"
            style={{
              fontSize: 10.5,
              color: 'var(--tx-4)',
              border: '1px solid var(--line-2)',
              borderRadius: 4,
              padding: '1px 5px',
            }}
          >
            ⌘K
          </span>
        </div>
        <div style={{ position: 'relative' }}>
          <button
            onClick={() => setAlarmsOpen((o) => !o)}
            style={{
              position: 'relative',
              width: 38,
              height: 38,
              borderRadius: 9,
              display: 'grid',
              placeItems: 'center',
              background: alarmsOpen ? 'var(--panel-hi)' : 'var(--panel)',
              border: `1px solid ${alarmsOpen ? 'var(--line-3)' : 'var(--line-2)'}`,
              color: 'var(--tx-1)',
            }}
          >
            <Icon name="bell" size={18} />
            {activeAlarms.length > 0 && (
              <span
                className="tnum"
                style={{
                  position: 'absolute',
                  top: -4,
                  right: -4,
                  minWidth: 17,
                  height: 17,
                  padding: '0 4px',
                  borderRadius: 999,
                  background: 'var(--crit)',
                  color: '#fff',
                  fontSize: 10,
                  fontWeight: 700,
                  display: 'grid',
                  placeItems: 'center',
                  border: '2px solid var(--bg-0)',
                }}
              >
                {activeAlarms.length}
              </span>
            )}
          </button>
          {alarmsOpen && (
            <AlarmDropdown alarms={activeAlarms} onClose={() => setAlarmsOpen(false)} />
          )}
        </div>
      </div>
    </header>
  );
}
