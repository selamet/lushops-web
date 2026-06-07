import { Fragment, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Icon, ServiceChip, type IconName } from '@/components/ui';
import { containerAction } from '@/lib/containerActions';
import { paths } from '@/lib/routes';
import { useOverlay } from '@/store/overlay';
import type { App, ServiceType } from '@/types';

interface CommandItem {
  group: string;
  label: string;
  icon?: IconName;
  svc?: ServiceType;
  hint?: string;
  action?: boolean;
  run: () => void;
}

interface CommandPaletteProps {
  open: boolean;
  onClose: () => void;
  apps: App[];
}

/** ⌘K command palette: grouped fuzzy search over navigation and actions. */
export function CommandPalette({ open, onClose, apps }: CommandPaletteProps) {
  const navigate = useNavigate();
  const toast = useOverlay((s) => s.toast);
  const [q, setQ] = useState('');
  const [sel, setSel] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setQ('');
      setSel(0);
      setTimeout(() => inputRef.current?.focus(), 30);
    }
  }, [open]);

  const items = useMemo<CommandItem[]>(() => {
    const out: CommandItem[] = [
      { group: 'Git', icon: 'grid', label: 'Genel bakış', run: () => navigate(paths.overview()) },
      { group: 'Git', icon: 'bell', label: 'Alarmlar', run: () => navigate(paths.alarms()) },
      { group: 'Git', icon: 'settings', label: 'Ayarlar', run: () => navigate(paths.settings()) },
      { group: 'Git', icon: 'plus', label: 'Uygulama ekle', run: () => navigate(paths.add()) },
    ];
    apps.forEach((a) =>
      out.push({
        group: 'Uygulama',
        icon: 'layers',
        label: a.name,
        hint: a.env,
        run: () => navigate(paths.app(a.id)),
      }),
    );
    apps.forEach((a) =>
      a.containers.forEach((c) =>
        out.push({
          group: 'Container',
          svc: c.svc,
          label: c.name,
          hint: a.name,
          run: () => navigate(paths.container(a.id, c.id)),
        }),
      ),
    );
    apps.forEach((a) =>
      a.containers
        .filter((c) => c.status !== 'running' || c.health === 'unhealthy')
        .forEach((c) =>
          out.push({
            group: 'Aksiyon',
            icon: 'restart',
            label: `Restart ${c.name}`,
            action: true,
            run: () => containerAction(c, 'restart'),
          }),
        ),
    );
    out.push({
      group: 'Aksiyon',
      icon: 'refresh',
      label: 'Tüm filoyu yenile',
      action: true,
      run: () => toast('Filo yenilendi', { type: 'success', sub: '5 app · 23 container' }),
    });
    out.push({
      group: 'Aksiyon',
      icon: 'slack',
      label: 'Slack test bildirimi gönder',
      action: true,
      run: () => toast('Slack’e test gönderildi', { type: 'success', sub: '#alerts-prod' }),
    });
    return out;
  }, [apps, navigate, toast]);

  const filtered = useMemo(() => {
    if (!q.trim()) return items;
    const s = q.toLowerCase();
    return items.filter((i) =>
      (i.label + ' ' + (i.hint || '') + ' ' + i.group).toLowerCase().includes(s),
    );
  }, [q, items]);

  useEffect(() => setSel(0), [q]);

  useEffect(() => {
    if (!open) return;
    const h = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      else if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSel((s) => Math.min(s + 1, filtered.length - 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSel((s) => Math.max(s - 1, 0));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        const it = filtered[sel];
        if (it) {
          onClose();
          it.run();
        }
      }
    };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [open, filtered, sel, onClose]);

  if (!open) return null;
  let lastGroup: string | null = null;

  return (
    <div
      onMouseDown={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(4,7,12,0.6)',
        backdropFilter: 'blur(3px)',
        zIndex: 180,
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'flex-start',
        paddingTop: '12vh',
      }}
    >
      <div
        onMouseDown={(e) => e.stopPropagation()}
        style={{
          width: 600,
          maxWidth: '92%',
          background: 'var(--elev)',
          border: '1px solid var(--line-3)',
          borderRadius: 15,
          overflow: 'hidden',
          boxShadow: 'var(--shadow-pop)',
          animation: 'popIn .2s cubic-bezier(.2,.8,.3,1) both',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 11,
            padding: '15px 18px',
            borderBottom: '1px solid var(--line)',
          }}
        >
          <Icon name="search" size={18} color="var(--tx-3)" />
          <input
            ref={inputRef}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="App, container, aksiyon ara…"
            style={{
              flex: 1,
              background: 'none',
              border: 'none',
              outline: 'none',
              color: 'var(--tx-0)',
              fontSize: 15,
            }}
          />
          <span
            className="mono"
            style={{
              fontSize: 10.5,
              color: 'var(--tx-4)',
              border: '1px solid var(--line-2)',
              borderRadius: 5,
              padding: '2px 7px',
            }}
          >
            ESC
          </span>
        </div>
        <div style={{ maxHeight: 400, overflow: 'auto', padding: 7 }}>
          {filtered.length === 0 && (
            <div style={{ padding: 30, textAlign: 'center', color: 'var(--tx-3)', fontSize: 13 }}>
              Sonuç yok
            </div>
          )}
          {filtered.map((it, i) => {
            const showG = it.group !== lastGroup;
            lastGroup = it.group;
            const active = i === sel;
            return (
              <Fragment key={i}>
                {showG && (
                  <div
                    className="mono"
                    style={{
                      fontSize: 10,
                      fontWeight: 600,
                      letterSpacing: '0.1em',
                      textTransform: 'uppercase',
                      color: 'var(--tx-4)',
                      padding: '10px 11px 5px',
                    }}
                  >
                    {it.group}
                  </div>
                )}
                <div
                  onMouseEnter={() => setSel(i)}
                  onClick={() => {
                    onClose();
                    it.run();
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 11,
                    padding: '9px 11px',
                    borderRadius: 9,
                    cursor: 'pointer',
                    background: active ? 'var(--acc-soft)' : 'transparent',
                    border: `1px solid ${active ? 'var(--acc-line)' : 'transparent'}`,
                  }}
                >
                  {it.svc ? (
                    <ServiceChip svc={it.svc} size={24} />
                  ) : (
                    <div
                      style={{
                        width: 24,
                        height: 24,
                        borderRadius: 7,
                        display: 'grid',
                        placeItems: 'center',
                        background: it.action ? 'var(--acc-soft)' : 'var(--panel-hi)',
                        color: it.action ? 'var(--acc)' : 'var(--tx-2)',
                      }}
                    >
                      {it.icon && <Icon name={it.icon} size={14} />}
                    </div>
                  )}
                  <span
                    className={it.group === 'Container' || it.group === 'Uygulama' ? 'mono' : ''}
                    style={{
                      flex: 1,
                      fontSize: 13.5,
                      fontWeight: 500,
                      color: active ? 'var(--tx-0)' : 'var(--tx-1)',
                    }}
                  >
                    {it.label}
                  </span>
                  {it.hint && (
                    <span className="mono" style={{ fontSize: 11, color: 'var(--tx-3)' }}>
                      {it.hint}
                    </span>
                  )}
                  {active && <Icon name="arrowRight" size={14} color="var(--acc)" />}
                </div>
              </Fragment>
            );
          })}
        </div>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 16,
            padding: '10px 18px',
            borderTop: '1px solid var(--line)',
            background: 'var(--bg-1)',
            fontSize: 11,
            color: 'var(--tx-3)',
          }}
        >
          <span className="mono">↑↓ gez</span>
          <span className="mono">⏎ seç</span>
          <span className="mono">esc kapat</span>
        </div>
      </div>
    </div>
  );
}
