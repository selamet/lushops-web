import { useMemo, useState, type ReactNode } from 'react';
import { Navigate, useNavigate, useParams } from 'react-router-dom';
import { AreaChart, Badge, Button, Card, Icon, StatusDot, type IconName } from '@/components/ui';
import { ALARMS } from '@/data/alarms';
import { SEV, STATUS } from '@/data/services';
import { containerAction } from '@/lib/containerActions';
import { paths } from '@/lib/routes';
import { useOverlay } from '@/store/overlay';
import { useFleet } from '@/store/fleet';
import type { Alarm, AlarmState } from '@/types';

interface TimelineEntry {
  icon: IconName;
  color: string;
  title: string;
  detail: string;
  t: string;
}

interface RunbookStep {
  done: boolean;
  t: string;
  c: string;
}

const STATE_META: Record<AlarmState, { l: string; c: string }> = {
  active: { l: 'Aktif', c: 'var(--crit)' },
  acknowledged: { l: 'Onaylandı', c: 'var(--warn)' },
  resolved: { l: 'Çözüldü', c: 'var(--ok)' },
};

const RUNBOOKS: Record<string, RunbookStep[]> = {
  'container.status == exited': [
    { done: true, t: 'Exit code & sebebini kontrol et', c: "docker inspect --format '{{.State.ExitCode}}'" },
    { done: true, t: 'OOMKilled ise bellek limitini incele', c: 'docker stats --no-stream' },
    { done: false, t: 'Bellek limitini artır veya sızıntıyı düzelt', c: 'mem_limit: 4096m' },
    { done: false, t: 'Container’ı yeniden başlat', c: 'docker compose up -d --force-recreate worker' },
  ],
  'restarts > 5 / 10dk': [
    { done: true, t: 'Healthcheck endpoint’ini doğrula', c: 'curl localhost:8000/health' },
    { done: true, t: 'Bağımlılıkların (redis/db) ayakta olduğunu kontrol et', c: 'docker compose ps' },
    { done: false, t: 'Son deploy’u geri al (rollback)', c: 'docker compose pull && up -d' },
  ],
  default: [
    { done: true, t: 'İlgili metrikleri ve logları incele', c: 'docker logs --tail 200' },
    { done: false, t: 'Eşik kalıcıysa kuralı ayarla', c: '' },
    { done: false, t: 'Olayı çöz ve not ekle', c: '' },
  ],
};

function buildTimeline(a: Alarm, state: AlarmState): TimelineEntry[] {
  const entries: TimelineEntry[] = [
    { icon: 'alert', color: SEV[a.sev].color, title: 'Alarm tetiklendi', detail: `Kural eşleşti: ${a.rule}`, t: a.ts },
    { icon: 'slack', color: 'var(--acc)', title: 'Slack bildirimi gönderildi', detail: '#alerts-prod kanalına @here ile', t: a.ts },
  ];
  if (a.sev === 'critical') {
    entries.push({
      icon: 'restart',
      color: 'var(--warn)',
      title: 'Otomatik onarım denendi',
      detail: `compose restart ${a.container} — başarısız (3/3)`,
      t: 'az önce',
    });
  }
  if (state === 'acknowledged') {
    entries.push({ icon: 'check', color: 'var(--warn)', title: 'Emre K. tarafından onaylandı', detail: 'İnceleniyor olarak işaretlendi', t: '10 dk önce' });
  }
  if (state === 'resolved') {
    entries.push({ icon: 'check', color: 'var(--ok)', title: 'Olay çözüldü', detail: 'Metrikler normale döndü, alarm temizlendi', t: a.ts });
  }
  return entries;
}

/** Full incident lifecycle: timeline, runbook, metrics and related alarms. */
export function IncidentDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useOverlay((s) => s.toast);
  const apps = useFleet((s) => s.apps);

  const alarm = ALARMS.find((a) => a.id === id);
  const [state, setState] = useState<AlarmState>(alarm?.state ?? 'active');
  const timeline = useMemo(() => (alarm ? buildTimeline(alarm, state) : []), [alarm, state]);

  if (!alarm) return <Navigate to={paths.alarms()} replace />;

  const app = apps.find((a) => a.id === alarm.app);
  const container = app?.containers.find((c) => c.name === alarm.container);
  const meta = SEV[alarm.sev];
  const runbook = RUNBOOKS[alarm.rule] || RUNBOOKS.default;
  const stateMeta = STATE_META[state];
  const related = ALARMS.filter((x) => x.app === alarm.app && x.id !== alarm.id);

  const metaCells: Array<[string, ReactNode]> = [
    [
      'Durum',
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 7 }}>
        <StatusDot color={stateMeta.c} size={7} pulse={state === 'active'} />
        <span style={{ color: stateMeta.c, fontWeight: 600 }}>{stateMeta.l}</span>
      </span>,
    ],
    [
      'Uygulama',
      <span
        className="mono"
        style={{ color: 'var(--acc-2)', cursor: 'pointer' }}
        onClick={() => navigate(paths.app(alarm.app))}
      >
        {alarm.app}
      </span>,
    ],
    [
      'Container',
      <span
        className="mono"
        style={{ color: 'var(--tx-1)', cursor: container ? 'pointer' : 'default' }}
        onClick={() => container && app && navigate(paths.container(app.id, container.id))}
      >
        {alarm.container}
      </span>,
    ],
    ['İlk görülme', <span className="mono" style={{ color: 'var(--tx-1)' }}>{alarm.ts}</span>],
    ['Kural', <span className="mono" style={{ color: 'var(--warn)' }}>{alarm.rule}</span>],
  ];

  return (
    <div className="fade-up" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12.5, color: 'var(--tx-2)' }}>
        <span className="mono" style={{ cursor: 'pointer' }} onClick={() => navigate(paths.alarms())}>
          alarmlar
        </span>
        <Icon name="chevR" size={13} color="var(--tx-3)" />
        <span className="mono" style={{ color: 'var(--tx-1)' }}>
          olay #{alarm.id.toUpperCase()}
        </span>
      </div>

      <div
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          gap: 16,
          flexWrap: 'wrap',
        }}
      >
        <div style={{ display: 'flex', gap: 14 }}>
          <div
            style={{
              width: 46,
              height: 46,
              borderRadius: 12,
              display: 'grid',
              placeItems: 'center',
              background: meta.soft,
              color: meta.color,
              flexShrink: 0,
            }}
          >
            <Icon name={alarm.sev === 'info' ? 'bell' : 'alert'} size={22} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
              <h1 style={{ margin: 0, fontSize: 21, fontWeight: 700, letterSpacing: '-0.01em' }}>
                {alarm.title}
              </h1>
              <Badge color={meta.color} bg={meta.soft} line={meta.line}>
                {meta.label}
              </Badge>
            </div>
            <div style={{ fontSize: 13, color: 'var(--tx-2)', marginTop: 5 }}>{alarm.detail}</div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {state === 'active' && (
            <Button
              variant="ghost"
              size="sm"
              icon="check"
              onClick={() => {
                setState('acknowledged');
                toast('Olay onaylandı', { type: 'warn', sub: 'Emre K. · inceleniyor' });
              }}
            >
              Onayla
            </Button>
          )}
          {state !== 'resolved' && (
            <Button
              variant="primary"
              size="sm"
              icon="check"
              onClick={() => {
                setState('resolved');
                toast('Olay çözüldü olarak işaretlendi', { type: 'success' });
              }}
            >
              Çöz
            </Button>
          )}
          {container && (
            <Button variant="ghost" size="sm" icon="restart" onClick={() => containerAction(container, 'restart')}>
              Restart
            </Button>
          )}
        </div>
      </div>

      <Card pad={0}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)' }}>
          {metaCells.map(([l, v], i) => (
            <div key={l} style={{ padding: '15px 18px', borderLeft: i ? '1px solid var(--line)' : 'none' }}>
              <div
                style={{
                  fontSize: 10.5,
                  color: 'var(--tx-3)',
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                }}
              >
                {l}
              </div>
              <div style={{ fontSize: 13, marginTop: 7 }}>{v}</div>
            </div>
          ))}
        </div>
      </Card>

      <div style={{ display: 'grid', gridTemplateColumns: '1.3fr 1fr', gap: 16, alignItems: 'start' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <Card pad={20}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 18 }}>
              <Icon name="activity" size={16} color="var(--acc)" />
              <span style={{ fontSize: 14, fontWeight: 700 }}>Olay zaman çizelgesi</span>
            </div>
            <div style={{ position: 'relative' }}>
              <div
                style={{ position: 'absolute', left: 15, top: 6, bottom: 6, width: 2, background: 'var(--line-2)' }}
              />
              {timeline.map((e, i) => (
                <div
                  key={i}
                  style={{
                    display: 'flex',
                    gap: 14,
                    position: 'relative',
                    paddingBottom: i === timeline.length - 1 ? 0 : 20,
                  }}
                >
                  <div
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: '50%',
                      display: 'grid',
                      placeItems: 'center',
                      background: 'var(--panel-2)',
                      border: `2px solid ${e.color}`,
                      color: e.color,
                      flexShrink: 0,
                      zIndex: 1,
                    }}
                  >
                    <Icon name={e.icon} size={15} />
                  </div>
                  <div style={{ paddingTop: 3 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <span style={{ fontSize: 13.5, fontWeight: 600 }}>{e.title}</span>
                      <span className="mono" style={{ fontSize: 11, color: 'var(--tx-3)' }}>
                        {e.t}
                      </span>
                    </div>
                    <div className="mono" style={{ fontSize: 12, color: 'var(--tx-2)', marginTop: 3 }}>
                      {e.detail}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          <Card pad={20}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: 16,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                <Icon name="doc" size={16} color="var(--acc)" />
                <span style={{ fontSize: 14, fontWeight: 700 }}>Runbook</span>
              </div>
              <span className="mono" style={{ fontSize: 11, color: 'var(--tx-3)' }}>
                {runbook.filter((r) => r.done).length}/{runbook.length} adım
              </span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 11 }}>
              {runbook.map((r, i) => (
                <div key={i} style={{ display: 'flex', gap: 11, alignItems: 'flex-start' }}>
                  <div
                    style={{
                      width: 20,
                      height: 20,
                      borderRadius: 6,
                      marginTop: 1,
                      display: 'grid',
                      placeItems: 'center',
                      flexShrink: 0,
                      background: r.done ? 'var(--ok-soft)' : 'var(--panel-hi)',
                      border: `1px solid ${r.done ? 'var(--ok-line)' : 'var(--line-2)'}`,
                      color: 'var(--ok)',
                    }}
                  >
                    {r.done && <Icon name="check" size={13} strokeW={2.6} />}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div
                      style={{
                        fontSize: 13,
                        color: r.done ? 'var(--tx-2)' : 'var(--tx-0)',
                        textDecoration: r.done ? 'line-through' : 'none',
                      }}
                    >
                      {r.t}
                    </div>
                    {r.c && (
                      <div
                        className="mono"
                        style={{
                          fontSize: 11.5,
                          color: 'var(--tx-3)',
                          marginTop: 3,
                          padding: '4px 8px',
                          borderRadius: 6,
                          background: 'var(--bg-0)',
                          border: '1px solid var(--line)',
                          display: 'inline-block',
                        }}
                      >
                        {r.c}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {container && (
            <Card pad={18}>
              <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 14 }}>Olay anındaki metrikler</div>
              <div
                style={{
                  marginBottom: 6,
                  display: 'flex',
                  justifyContent: 'space-between',
                  fontSize: 12,
                }}
              >
                <span style={{ color: 'var(--tx-2)' }}>CPU</span>
                <span className="mono" style={{ color: STATUS[container.status]?.color, fontWeight: 600 }}>
                  {container.status === 'exited' ? '0%' : container.cpu + '%'}
                </span>
              </div>
              <AreaChart data={container.cpuSeries} color={STATUS[container.status]?.color} max={100} h={120} />
              <div
                style={{
                  margin: '14px 0 6px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  fontSize: 12,
                }}
              >
                <span style={{ color: 'var(--tx-2)' }}>Bellek</span>
                <span className="mono" style={{ color: 'var(--acc)', fontWeight: 600 }}>
                  %{container.memPct}
                </span>
              </div>
              <AreaChart data={container.memSeries} color="var(--acc)" max={100} h={120} />
            </Card>
          )}
          <Card pad={18}>
            <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 12 }}>
              Aynı app’teki diğer alarmlar
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {related.length === 0 && (
                <div style={{ fontSize: 12.5, color: 'var(--tx-3)' }}>Başka alarm yok.</div>
              )}
              {related.map((r) => (
                <div
                  key={r.id}
                  onClick={() => navigate(paths.incident(r.id))}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    padding: '9px 11px',
                    borderRadius: 9,
                    background: 'var(--bg-1)',
                    border: '1px solid var(--line)',
                    cursor: 'pointer',
                  }}
                >
                  <StatusDot color={SEV[r.sev].color} size={7} />
                  <span
                    style={{
                      flex: 1,
                      fontSize: 12.5,
                      fontWeight: 500,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {r.title}
                  </span>
                  <span className="mono" style={{ fontSize: 11, color: 'var(--tx-3)' }}>
                    {r.ts}
                  </span>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
