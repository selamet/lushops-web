import { useCallback, useEffect, useState, type ReactNode } from 'react';
import { Navigate, useNavigate, useParams } from 'react-router-dom';
import { AreaChart, Badge, Button, Card, Icon, StatusDot, type IconName } from '@/components/ui';
import { SEV, STATUS } from '@/data/services';
import { containerAction } from '@/lib/containerActions';
import { paths } from '@/lib/routes';
import { relativeTime } from '@/api/map';
import { api } from '@/api/endpoints';
import { useOverlay } from '@/store/overlay';
import { useAlarms } from '@/store/alarms';
import { useFleet } from '@/store/fleet';
import type { ApiAlarmDetail } from '@/api/types';
import type { AlarmState } from '@/types';

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
  'restarts > 5 / 10m': [
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

/** Icon + color for a timeline event by its kind. */
function eventMeta(kind: string, severityColor: string): { icon: IconName; color: string } {
  switch (kind) {
    case 'trigger':
      return { icon: 'alert', color: severityColor };
    case 'notify':
      return { icon: 'slack', color: 'var(--acc)' };
    case 'remediation':
      return { icon: 'restart', color: 'var(--warn)' };
    case 'ack':
      return { icon: 'check', color: 'var(--warn)' };
    case 'resolve':
      return { icon: 'check', color: 'var(--ok)' };
    default:
      return { icon: 'activity', color: 'var(--tx-2)' };
  }
}

/** Full incident lifecycle: timeline, runbook, metrics and related alarms. */
export function IncidentDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useOverlay((s) => s.toast);
  const apps = useFleet((s) => s.apps);
  const appNameById = useFleet((s) => s.appNameById);
  const alarms = useAlarms((s) => s.alarms);
  const acknowledge = useAlarms((s) => s.acknowledge);
  const resolve = useAlarms((s) => s.resolve);

  const [detail, setDetail] = useState<ApiAlarmDetail | null>(null);
  const [missing, setMissing] = useState(false);

  const refetch = useCallback(() => {
    if (!id) return;
    api
      .getAlarm(id)
      .then(setDetail)
      .catch(() => setMissing(true));
  }, [id]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  if (missing) return <Navigate to={paths.alarms()} replace />;
  if (!detail) return null;

  const meta = SEV[detail.severity];
  const appName = appNameById[detail.appId] ?? detail.appId;
  const app = apps.find((a) => a.id === appName);
  const container = apps.flatMap((a) => a.containers).find((c) => c.id === detail.containerId);
  const containerName = container?.name ?? '—';
  const runbook = RUNBOOKS[detail.rule] || RUNBOOKS.default;
  const stateMeta = STATE_META[detail.state];
  const related = alarms.filter((x) => x.app === appName && x.id !== detail.id);

  const onAcknowledge = () =>
    acknowledge(detail.id).then(() => {
      refetch();
      toast('Olay onaylandı', { type: 'warn', sub: containerName });
    });
  const onResolve = () =>
    resolve(detail.id).then(() => {
      refetch();
      toast('Olay çözüldü olarak işaretlendi', { type: 'success' });
    });

  const metaCells: Array<[string, ReactNode]> = [
    [
      'Durum',
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 7 }}>
        <StatusDot color={stateMeta.c} size={7} pulse={detail.state === 'active'} />
        <span style={{ color: stateMeta.c, fontWeight: 600 }}>{stateMeta.l}</span>
      </span>,
    ],
    [
      'Uygulama',
      <span
        className="mono"
        style={{ color: 'var(--acc-2)', cursor: app ? 'pointer' : 'default' }}
        onClick={() => app && navigate(paths.app(app.id))}
      >
        {appName}
      </span>,
    ],
    [
      'Container',
      <span
        className="mono"
        style={{ color: 'var(--tx-1)', cursor: container && app ? 'pointer' : 'default' }}
        onClick={() => container && app && navigate(paths.container(app.id, container.id))}
      >
        {containerName}
      </span>,
    ],
    ['İlk görülme', <span className="mono" style={{ color: 'var(--tx-1)' }}>{relativeTime(detail.triggeredAt)}</span>],
    ['Kural', <span className="mono" style={{ color: 'var(--warn)' }}>{detail.rule}</span>],
  ];

  return (
    <div className="fade-up" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12.5, color: 'var(--tx-2)' }}>
        <span className="mono" style={{ cursor: 'pointer' }} onClick={() => navigate(paths.alarms())}>
          alarmlar
        </span>
        <Icon name="chevR" size={13} color="var(--tx-3)" />
        <span className="mono" style={{ color: 'var(--tx-1)' }}>
          olay #{detail.id.slice(0, 8).toUpperCase()}
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
            <Icon name={detail.severity === 'info' ? 'bell' : 'alert'} size={22} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
              <h1 style={{ margin: 0, fontSize: 21, fontWeight: 700, letterSpacing: '-0.01em' }}>
                {detail.title}
              </h1>
              <Badge color={meta.color} bg={meta.soft} line={meta.line}>
                {meta.label}
              </Badge>
            </div>
            <div style={{ fontSize: 13, color: 'var(--tx-2)', marginTop: 5 }}>{detail.detail}</div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {detail.state === 'active' && (
            <Button variant="ghost" size="sm" icon="check" onClick={onAcknowledge}>
              Onayla
            </Button>
          )}
          {detail.state !== 'resolved' && (
            <Button variant="primary" size="sm" icon="check" onClick={onResolve}>
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
              {detail.events.map((e, i) => {
                const em = eventMeta(e.kind, meta.color);
                return (
                  <div
                    key={i}
                    style={{
                      display: 'flex',
                      gap: 14,
                      position: 'relative',
                      paddingBottom: i === detail.events.length - 1 ? 0 : 20,
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
                        border: `2px solid ${em.color}`,
                        color: em.color,
                        flexShrink: 0,
                        zIndex: 1,
                      }}
                    >
                      <Icon name={em.icon} size={15} />
                    </div>
                    <div style={{ paddingTop: 3 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <span style={{ fontSize: 13.5, fontWeight: 600 }}>{e.title}</span>
                        <span className="mono" style={{ fontSize: 11, color: 'var(--tx-3)' }}>
                          {relativeTime(e.occurredAt)}
                        </span>
                      </div>
                      {e.detail && (
                        <div className="mono" style={{ fontSize: 12, color: 'var(--tx-2)', marginTop: 3 }}>
                          {e.detail}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
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
