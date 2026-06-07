import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Badge, Icon } from '@/components/ui';
import { SEV } from '@/data/services';
import { paths } from '@/lib/routes';
import type { Alarm } from '@/types';

interface AlarmDropdownProps {
  alarms: Alarm[];
  onClose: () => void;
}

/** Notification dropdown anchored under the topbar bell. */
export function AlarmDropdown({ alarms, onClose }: AlarmDropdownProps) {
  const navigate = useNavigate();

  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (!(e.target as Element).closest('.alarm-dd')) onClose();
    };
    const id = setTimeout(() => document.addEventListener('click', h), 0);
    return () => {
      clearTimeout(id);
      document.removeEventListener('click', h);
    };
  }, [onClose]);

  const open = (id: string) => {
    onClose();
    navigate(paths.incident(id));
  };

  return (
    <div
      className="alarm-dd"
      style={{
        position: 'absolute',
        top: 46,
        right: 0,
        width: 380,
        background: 'var(--elev)',
        border: '1px solid var(--line-3)',
        borderRadius: 13,
        boxShadow: 'var(--shadow-pop)',
        overflow: 'hidden',
        zIndex: 50,
        animation: 'fadeUp .18s ease both',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '13px 16px',
          borderBottom: '1px solid var(--line)',
        }}
      >
        <span style={{ fontWeight: 700, fontSize: 13.5 }}>Aktif alarmlar</span>
        <Badge color="var(--crit)" bg="var(--crit-soft)" line="var(--crit-line)">
          {alarms.length}
        </Badge>
      </div>
      <div style={{ maxHeight: 360, overflow: 'auto' }}>
        {alarms.map((a) => {
          const meta = SEV[a.sev];
          return (
            <div
              key={a.id}
              onClick={() => open(a.id)}
              style={{
                display: 'flex',
                gap: 11,
                padding: '12px 16px',
                borderBottom: '1px solid var(--line)',
                cursor: 'pointer',
              }}
            >
              <div
                style={{
                  width: 30,
                  height: 30,
                  borderRadius: 8,
                  display: 'grid',
                  placeItems: 'center',
                  background: meta.soft,
                  color: meta.color,
                  flexShrink: 0,
                }}
              >
                <Icon name={a.sev === 'info' ? 'bell' : 'alert'} size={15} />
              </div>
              <div style={{ minWidth: 0 }}>
                <div
                  style={{
                    fontSize: 13,
                    fontWeight: 600,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {a.title}
                </div>
                <div className="mono" style={{ fontSize: 11, color: 'var(--tx-3)', marginTop: 2 }}>
                  {a.container} · {a.ts}
                </div>
              </div>
            </div>
          );
        })}
      </div>
      <button
        onClick={() => {
          onClose();
          navigate(paths.alarms());
        }}
        style={{
          width: '100%',
          padding: '12px',
          fontSize: 12.5,
          fontWeight: 600,
          color: 'var(--acc)',
          background: 'var(--panel)',
        }}
      >
        Tüm alarmları gör →
      </button>
    </div>
  );
}
