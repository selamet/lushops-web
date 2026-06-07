import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Badge, Button, Card, Eyebrow, Icon, StatusDot } from '@/components/ui';
import { SEV } from '@/data/services';
import { paths } from '@/lib/routes';
import { useAlarms } from '@/store/alarms';
import { useOverlay } from '@/store/overlay';
import type { Alarm, AlarmState, Severity } from '@/types';

type StateFilter = AlarmState | 'all';
type SevFilter = Severity | 'all';

const STATE_META: Record<AlarmState, { l: string; c: string }> = {
  active: { l: 'Aktif', c: 'var(--crit)' },
  acknowledged: { l: 'Onaylandı', c: 'var(--warn)' },
  resolved: { l: 'Çözüldü', c: 'var(--ok)' },
};

/** Alarm list with severity summary and state/severity filters. */
export function Alarms() {
  const navigate = useNavigate();
  const toast = useOverlay((s) => s.toast);
  const alarms = useAlarms((s) => s.alarms);
  const [filter, setFilter] = useState<StateFilter>('active');
  const [sevFilter, setSevFilter] = useState<SevFilter>('all');

  const counts = {
    active: alarms.filter((a) => a.state === 'active').length,
    acknowledged: alarms.filter((a) => a.state === 'acknowledged').length,
    resolved: alarms.filter((a) => a.state === 'resolved').length,
  };

  let list = alarms.filter((a) => filter === 'all' || a.state === filter);
  if (sevFilter !== 'all') list = list.filter((a) => a.sev === sevFilter);

  const tabs: Array<{ k: StateFilter; label: string; n: number; color: string }> = [
    { k: 'active', label: 'Aktif', n: counts.active, color: 'var(--crit)' },
    { k: 'acknowledged', label: 'Onaylandı', n: counts.acknowledged, color: 'var(--warn)' },
    { k: 'resolved', label: 'Çözüldü', n: counts.resolved, color: 'var(--ok)' },
    { k: 'all', label: 'Tümü', n: alarms.length, color: 'var(--tx-2)' },
  ];

  const sevTabs: SevFilter[] = ['all', 'critical', 'warning', 'info'];

  return (
    <div className="fade-up" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 14,
        }}
      >
        <div>
          <Eyebrow>Olaylar</Eyebrow>
          <h1 style={{ margin: '4px 0 0', fontSize: 22, fontWeight: 700, letterSpacing: '-0.01em' }}>
            Alarmlar &amp; bildirimler
          </h1>
          <div style={{ fontSize: 13, color: 'var(--tx-2)', marginTop: 4 }}>
            Eşik kuralları tetiklendiğinde Slack’e anlık bildirim gider.
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <Button
            icon="slack"
            variant="ghost"
            size="sm"
            onClick={() => toast('Slack’e test bildirimi gönderildi', { type: 'success', sub: '#alerts-prod' })}
          >
            Slack test
          </Button>
          <Button icon="settings" variant="ghost" size="sm" onClick={() => navigate(paths.settings())}>
            Kuralları düzenle
          </Button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14 }}>
        {(['critical', 'warning', 'info'] as Severity[]).map((s) => {
          const n = alarms.filter((a) => a.sev === s && a.state === 'active').length;
          const meta = SEV[s];
          return (
            <Card key={s} pad={16} glow={s === 'critical' && n > 0}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div
                    style={{
                      width: 34,
                      height: 34,
                      borderRadius: 9,
                      display: 'grid',
                      placeItems: 'center',
                      background: meta.soft,
                      color: meta.color,
                    }}
                  >
                    <Icon name={s === 'info' ? 'bell' : 'alert'} size={17} />
                  </div>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--tx-1)' }}>{meta.label}</div>
                    <div style={{ fontSize: 11.5, color: 'var(--tx-3)' }}>aktif</div>
                  </div>
                </div>
                <div
                  className="tnum"
                  style={{ fontSize: 30, fontWeight: 800, color: n ? meta.color : 'var(--tx-3)' }}
                >
                  {n}
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 12,
          flexWrap: 'wrap',
        }}
      >
        <div
          style={{
            display: 'flex',
            gap: 6,
            background: 'var(--panel)',
            border: '1px solid var(--line-2)',
            borderRadius: 10,
            padding: 4,
          }}
        >
          {tabs.map((t) => {
            const active = filter === t.k;
            return (
              <button
                key={t.k}
                onClick={() => setFilter(t.k)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 7,
                  padding: '6px 13px',
                  borderRadius: 7,
                  fontSize: 12.5,
                  fontWeight: 600,
                  color: active ? 'var(--tx-0)' : 'var(--tx-2)',
                  background: active ? 'var(--panel-hi)' : 'transparent',
                  border: `1px solid ${active ? 'var(--line-2)' : 'transparent'}`,
                }}
              >
                {t.label}
                <span
                  className="mono tnum"
                  style={{
                    fontSize: 11,
                    padding: '1px 6px',
                    borderRadius: 999,
                    background: active ? t.color : 'var(--bg-1)',
                    color: active ? '#08101e' : 'var(--tx-2)',
                  }}
                >
                  {t.n}
                </span>
              </button>
            );
          })}
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          {sevTabs.map((s) => {
            const active = sevFilter === s;
            const isAll = s === 'all';
            return (
              <button
                key={s}
                onClick={() => setSevFilter(s)}
                style={{
                  padding: '6px 12px',
                  borderRadius: 8,
                  fontSize: 12,
                  fontWeight: 600,
                  color: active ? (isAll ? 'var(--tx-0)' : SEV[s].color) : 'var(--tx-3)',
                  background: active ? (isAll ? 'var(--panel-hi)' : SEV[s].soft) : 'transparent',
                  border: `1px solid ${active ? (isAll ? 'var(--line-2)' : SEV[s].line) : 'var(--line)'}`,
                }}
              >
                {isAll ? 'Tüm seviyeler' : SEV[s].label}
              </button>
            );
          })}
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {list.map((a) => (
          <AlarmRow key={a.id} a={a} />
        ))}
        {!list.length && (
          <Card pad={40}>
            <div style={{ textAlign: 'center', color: 'var(--tx-3)' }}>
              <Icon name="check" size={26} color="var(--ok)" />
              <div style={{ marginTop: 8 }}>Bu filtrede alarm yok</div>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}

function AlarmRow({ a }: { a: Alarm }) {
  const navigate = useNavigate();
  const toast = useOverlay((s) => s.toast);
  const acknowledge = useAlarms((s) => s.acknowledge);
  const resolve = useAlarms((s) => s.resolve);
  const [h, setH] = useState(false);
  const meta = SEV[a.sev];
  const stateMeta = STATE_META[a.state];

  return (
    <Card pad={0} hover style={{ overflow: 'hidden', opacity: a.state === 'resolved' ? 0.72 : 1 }}>
      <div
        onMouseEnter={() => setH(true)}
        onMouseLeave={() => setH(false)}
        style={{ display: 'flex', alignItems: 'stretch' }}
      >
        <div style={{ width: 4, background: meta.color, flexShrink: 0 }} />
        <div style={{ padding: '15px 18px', flex: 1, display: 'flex', alignItems: 'center', gap: 16 }}>
          <div
            style={{
              width: 38,
              height: 38,
              borderRadius: 10,
              display: 'grid',
              placeItems: 'center',
              background: meta.soft,
              color: meta.color,
              flexShrink: 0,
            }}
          >
            <Icon name={a.sev === 'info' ? 'bell' : 'alert'} size={18} />
          </div>
          <div
            style={{ flex: 1, minWidth: 0, cursor: 'pointer' }}
            onClick={() => navigate(paths.incident(a.id))}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
              <span style={{ fontWeight: 700, fontSize: 14 }}>{a.title}</span>
              <Badge color={meta.color} bg={meta.soft} line={meta.line}>
                {meta.label}
              </Badge>
              {a.auto && (
                <Badge color="var(--tx-2)" bg="var(--panel-hi)" line="var(--line-2)">
                  oto
                </Badge>
              )}
            </div>
            <div style={{ fontSize: 12.5, color: 'var(--tx-2)', marginTop: 4 }}>{a.detail}</div>
            <div
              className="mono"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                marginTop: 8,
                fontSize: 11.5,
                color: 'var(--tx-3)',
                flexWrap: 'wrap',
              }}
            >
              <span
                style={{ color: 'var(--acc-2)', cursor: 'pointer' }}
                onClick={(e) => {
                  e.stopPropagation();
                  navigate(paths.app(a.app));
                }}
              >
                {a.app}
              </span>
              <span>/</span>
              <span style={{ color: 'var(--tx-2)' }}>{a.container}</span>
              <span
                style={{
                  padding: '1px 7px',
                  borderRadius: 5,
                  background: 'var(--bg-1)',
                  border: '1px solid var(--line)',
                }}
              >
                kural: {a.rule}
              </span>
            </div>
          </div>
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'flex-end',
              gap: 8,
              flexShrink: 0,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 12 }}>
              <StatusDot color={stateMeta.c} size={6} pulse={a.state === 'active'} />
              <span style={{ color: stateMeta.c, fontWeight: 600 }}>{stateMeta.l}</span>
            </div>
            <div className="mono" style={{ fontSize: 11.5, color: 'var(--tx-3)' }}>
              {a.ts}
            </div>
            {a.state === 'active' && h && (
              <div style={{ display: 'flex', gap: 6 }}>
                <Button
                  variant="soft"
                  size="sm"
                  onClick={() =>
                    acknowledge(a.id).then(() => toast('Olay onaylandı', { type: 'warn', sub: a.container }))
                  }
                >
                  Onayla
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() =>
                    resolve(a.id).then(() => toast('Olay çözüldü', { type: 'success', sub: a.container }))
                  }
                >
                  Çöz
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
}
