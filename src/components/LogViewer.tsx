import { useState, type ReactNode } from 'react';
import { Button, Card, Icon, StatusDot } from '@/components/ui';
import { useOverlay } from '@/store/overlay';
import type { LogLevel, LogLine } from '@/types';

const LVL_COLOR: Record<LogLevel, string> = {
  info: 'var(--tx-2)',
  warn: 'var(--warn)',
  error: 'var(--crit)',
  fatal: '#ff7b91',
};

const LVL_BG: Record<LogLevel, string> = {
  info: 'transparent',
  warn: 'rgba(251,191,36,0.05)',
  error: 'rgba(245,85,109,0.06)',
  fatal: 'rgba(245,85,109,0.1)',
};

type LevelFilter = 'all' | 'info' | 'warn' | 'error';

/** Log panel with search highlighting, level filter and a live/paused toggle. */
export function LogViewer({ logs }: { logs: LogLine[] }) {
  const toast = useOverlay((s) => s.toast);
  const [q, setQ] = useState('');
  const [lvl, setLvl] = useState<LevelFilter>('all');
  const [follow, setFollow] = useState(true);

  const counts = {
    all: logs.length,
    info: logs.filter((l) => l.lvl === 'info').length,
    warn: logs.filter((l) => l.lvl === 'warn').length,
    error: logs.filter((l) => l.lvl === 'error' || l.lvl === 'fatal').length,
  };

  const filtered = logs.filter((l) => {
    if (lvl === 'error' && !(l.lvl === 'error' || l.lvl === 'fatal')) return false;
    if (lvl !== 'all' && lvl !== 'error' && l.lvl !== lvl) return false;
    if (q && !l.m.toLowerCase().includes(q.toLowerCase())) return false;
    return true;
  });

  const highlight = (text: string): ReactNode => {
    if (!q) return text;
    const idx = text.toLowerCase().indexOf(q.toLowerCase());
    if (idx < 0) return text;
    return (
      <>
        {text.slice(0, idx)}
        <mark style={{ background: 'var(--acc)', color: '#06101f', borderRadius: 3, padding: '0 2px' }}>
          {text.slice(idx, idx + q.length)}
        </mark>
        {text.slice(idx + q.length)}
      </>
    );
  };

  const filters: Array<[LevelFilter, string]> = [
    ['all', 'Tümü'],
    ['info', 'info'],
    ['warn', 'warn'],
    ['error', 'error'],
  ];

  return (
    <Card pad={0} style={{ overflow: 'hidden' }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          padding: '11px 14px',
          borderBottom: '1px solid var(--line)',
          background: 'var(--bg-1)',
          flexWrap: 'wrap',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            background: 'var(--bg-0)',
            border: '1px solid var(--line-2)',
            borderRadius: 8,
            padding: '6px 10px',
            flex: 1,
            minWidth: 180,
          }}
        >
          <Icon name="search" size={14} color="var(--tx-3)" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Loglarda ara…"
            className="mono"
            style={{
              flex: 1,
              background: 'none',
              border: 'none',
              outline: 'none',
              color: 'var(--tx-0)',
              fontSize: 12.5,
            }}
          />
        </div>
        <div style={{ display: 'flex', gap: 4 }}>
          {filters.map(([k, l]) => {
            const active = lvl === k;
            const accent = k === 'error' ? LVL_COLOR.error : LVL_COLOR[k as LogLevel];
            return (
              <button
                key={k}
                onClick={() => setLvl(k)}
                className="mono"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '6px 10px',
                  borderRadius: 7,
                  fontSize: 11.5,
                  fontWeight: 600,
                  color: active ? (k === 'all' ? 'var(--tx-0)' : accent) : 'var(--tx-3)',
                  background: active ? (k === 'all' ? 'var(--panel-hi)' : `${accent}1f`) : 'transparent',
                  border: `1px solid ${active ? 'var(--line-2)' : 'transparent'}`,
                }}
              >
                {l}
                <span style={{ opacity: 0.6 }}>{counts[k]}</span>
              </button>
            );
          })}
        </div>
        <button
          onClick={() => setFollow((f) => !f)}
          className="mono"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            padding: '6px 10px',
            borderRadius: 7,
            fontSize: 11.5,
            fontWeight: 600,
            color: follow ? 'var(--ok)' : 'var(--tx-3)',
            background: follow ? 'var(--ok-soft)' : 'var(--panel)',
            border: `1px solid ${follow ? 'var(--ok-line)' : 'var(--line-2)'}`,
          }}
        >
          <StatusDot color={follow ? 'var(--ok)' : 'var(--tx-3)'} size={6} pulse={follow} />
          {follow ? 'canlı' : 'durdu'}
        </button>
        <Button
          icon="copy"
          variant="soft"
          size="sm"
          onClick={() => toast('Loglar panoya kopyalandı', { type: 'success' })}
        >
          İndir
        </Button>
      </div>
      <div
        className="mono"
        style={{
          fontSize: 12.5,
          lineHeight: 1.9,
          padding: '10px 0',
          maxHeight: 360,
          overflow: 'auto',
          background: 'var(--bg-0)',
        }}
      >
        {filtered.map((l, i) => (
          <div key={i} style={{ display: 'flex', gap: 14, padding: '1px 16px', background: LVL_BG[l.lvl] }}>
            <span style={{ color: 'var(--tx-4)', flexShrink: 0 }}>{l.t}</span>
            <span
              style={{
                color: LVL_COLOR[l.lvl],
                textTransform: 'uppercase',
                fontSize: 10.5,
                fontWeight: 700,
                width: 42,
                flexShrink: 0,
                paddingTop: 1,
              }}
            >
              {l.lvl}
            </span>
            <span style={{ color: l.lvl === 'info' ? 'var(--tx-1)' : LVL_COLOR[l.lvl] }}>
              {highlight(l.m)}
            </span>
          </div>
        ))}
        {!filtered.length && (
          <div style={{ padding: 30, textAlign: 'center', color: 'var(--tx-3)' }}>
            Eşleşen log satırı yok
          </div>
        )}
        {follow && filtered.length > 0 && (
          <div style={{ display: 'flex', gap: 14, padding: '1px 16px', color: 'var(--tx-4)' }}>
            <span style={{ width: 64 }} />
            <span
              style={{
                width: 10,
                height: 15,
                background: 'var(--acc)',
                display: 'inline-block',
                animation: 'pulseDot 1.2s steps(1) infinite',
              }}
            />
          </div>
        )}
      </div>
    </Card>
  );
}
