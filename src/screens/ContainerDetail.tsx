import { useMemo, useState, type ReactNode } from 'react';
import { Navigate, useNavigate, useParams } from 'react-router-dom';
import { LogViewer } from '@/components/LogViewer';
import {
  AreaChart,
  Badge,
  Button,
  Card,
  Icon,
  ServiceChip,
  Sparkline,
  StatusDot,
  StatusPill,
  type IconName,
} from '@/components/ui';
import { STATUS } from '@/data/services';
import { genLogs } from '@/data/logs';
import { containerAction } from '@/lib/containerActions';
import { paths } from '@/lib/routes';
import { useOverlay } from '@/store/overlay';
import { useFleet } from '@/store/fleet';
import type { App, Container } from '@/types';

type Tab = 'metrics' | 'logs' | 'inspect' | 'health';

/** Single container: stat tiles plus metrics/logs/inspect/health tabs. */
export function ContainerDetail() {
  const { id, cid } = useParams();
  const navigate = useNavigate();
  const openTerminal = useOverlay((s) => s.openTerminal);
  const apps = useFleet((s) => s.apps);
  const loaded = useFleet((s) => s.loaded);
  const [tab, setTab] = useState<Tab>('metrics');

  const app = apps.find((a) => a.id === id);
  const c = app?.containers.find((x) => x.id === cid);
  const logs = useMemo(() => (c ? genLogs(c) : []), [c?.id, c?.status]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!loaded) return null;
  if (!app || !c) return <Navigate to={paths.overview()} replace />;

  const statusColor = STATUS[c.status]?.color;
  const exited = c.status === 'exited';

  const tabs: Array<[Tab, string, IconName]> = [
    ['metrics', 'Metrikler', 'activity'],
    ['logs', 'Loglar', 'terminal'],
    ['inspect', 'Inspect', 'doc'],
    ['health', 'Health check', 'shield'],
  ];

  return (
    <div className="fade-up" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12.5, color: 'var(--tx-2)' }}>
        <span className="mono" style={{ cursor: 'pointer' }} onClick={() => navigate(paths.overview())}>
          overview
        </span>
        <Icon name="chevR" size={13} color="var(--tx-3)" />
        <span className="mono" style={{ cursor: 'pointer' }} onClick={() => navigate(paths.app(app.id))}>
          {app.name}
        </span>
        <Icon name="chevR" size={13} color="var(--tx-3)" />
        <span className="mono" style={{ color: 'var(--tx-1)' }}>
          {c.name}
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
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <ServiceChip svc={c.svc} size={48} />
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
              <h1 className="mono" style={{ margin: 0, fontSize: 21, fontWeight: 700, whiteSpace: 'nowrap' }}>
                {c.name}
              </h1>
              <StatusPill status={c.status} pulse={c.status === 'restarting'} />
              {c.health === 'unhealthy' && (
                <Badge color="var(--warn)" bg="var(--warn-soft)" line="var(--warn-line)" dot>
                  unhealthy
                </Badge>
              )}
            </div>
            <div className="mono" style={{ fontSize: 12.5, color: 'var(--tx-2)', marginTop: 5 }}>
              {c.image}
              <span style={{ color: 'var(--acc-2)' }}>:{c.tag}</span> · ports {c.ports}
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {c.status === 'running' ? (
            <Button icon="pause" variant="ghost" size="sm" onClick={() => containerAction(c, 'stop')}>
              Durdur
            </Button>
          ) : (
            <Button icon="play" variant="ghost" size="sm" onClick={() => containerAction(c, 'start')}>
              Başlat
            </Button>
          )}
          <Button icon="restart" variant="ghost" size="sm" onClick={() => containerAction(c, 'restart')}>
            Yeniden başlat
          </Button>
          <Button icon="terminal" variant="primary" size="sm" onClick={() => openTerminal(c)}>
            exec /bin/sh
          </Button>
        </div>
      </div>

      {exited && (
        <div
          style={{
            display: 'flex',
            gap: 13,
            padding: '15px 18px',
            borderRadius: 'var(--radius)',
            background: 'var(--crit-soft)',
            border: '1px solid var(--crit-line)',
          }}
        >
          <Icon name="alert" size={20} color="var(--crit)" style={{ flexShrink: 0, marginTop: 1 }} />
          <div>
            <div style={{ fontWeight: 700, color: 'var(--crit)', fontSize: 14 }}>
              Container durdu — exit code {c.exitCode} ({c.exitReason})
            </div>
            <div style={{ fontSize: 13, color: 'var(--tx-1)', marginTop: 3 }}>
              Bellek limiti aşıldığı için süreç kernel tarafından sonlandırıldı. {c.restarts} otomatik
              yeniden başlatma denemesi başarısız.
            </div>
          </div>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14 }}>
        <StatTile icon="cpu" label="CPU" value={exited ? '—' : c.cpu + '%'} series={c.cpuSeries} color={statusColor} sub="limit: 2 vCPU" dim={exited} />
        <StatTile icon="mem" label="Bellek" value={exited ? '—' : c.mem + ' MB'} series={c.memSeries} color="var(--acc)" sub={`limit: ${c.memLimit} MB · %${c.memPct}`} dim={exited} />
        <StatTile icon="net" label="Network I/O" value={exited ? '—' : c.net + ' MB/s'} series={c.netSeries} color="var(--info)" sub="↑↓ toplam" dim={exited} />
        <StatTile icon="clock" label="Uptime" value={c.uptime} color="var(--tx-1)" plain sub={`${c.restarts} restart`} dim={exited} />
      </div>

      <div style={{ display: 'flex', gap: 4, borderBottom: '1px solid var(--line)' }}>
        {tabs.map(([k, l, ic]) => (
          <button
            key={k}
            onClick={() => setTab(k)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 7,
              padding: '10px 14px',
              fontSize: 13.5,
              fontWeight: 600,
              color: tab === k ? 'var(--tx-0)' : 'var(--tx-2)',
              borderBottom: `2px solid ${tab === k ? 'var(--acc)' : 'transparent'}`,
              marginBottom: -1,
              transition: 'all .15s',
            }}
          >
            <Icon name={ic} size={15} />
            {l}
          </button>
        ))}
      </div>

      {tab === 'metrics' && <MetricsTab c={c} statusColor={statusColor} />}
      {tab === 'logs' && <LogViewer logs={logs} />}
      {tab === 'inspect' && <InspectTab c={c} app={app} />}
      {tab === 'health' && <HealthTab c={c} />}
    </div>
  );
}

interface StatTileProps {
  icon: IconName;
  label: string;
  value: string;
  series?: number[];
  color: string;
  sub: string;
  plain?: boolean;
  dim?: boolean;
}

function StatTile({ icon, label, value, series, color, sub, plain, dim }: StatTileProps) {
  return (
    <Card pad={16}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--tx-2)' }}>
        <Icon name={icon} size={15} color={dim ? 'var(--tx-3)' : color} />
        <span style={{ fontSize: 12, fontWeight: 600 }}>{label}</span>
      </div>
      <div
        className="tnum"
        style={{
          fontSize: 25,
          fontWeight: 800,
          marginTop: 9,
          letterSpacing: '-0.02em',
          color: dim ? 'var(--tx-3)' : 'var(--tx-0)',
        }}
      >
        {value}
      </div>
      <div style={{ fontSize: 11.5, color: 'var(--tx-3)', marginTop: 2 }}>{sub}</div>
      {!plain && !dim && series && (
        <div style={{ marginTop: 10 }}>
          <Sparkline data={series} color={color} w={260} h={34} />
        </div>
      )}
      {(plain || dim) && <div style={{ height: 44 }} />}
    </Card>
  );
}

function MetricsTab({ c, statusColor }: { c: Container; statusColor: string }) {
  const [range, setRange] = useState('1h');
  const exited = c.status === 'exited';
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 6 }}>
        {['15dk', '1h', '6h', '24h'].map((r) => (
          <button
            key={r}
            onClick={() => setRange(r)}
            className="mono"
            style={{
              padding: '5px 11px',
              borderRadius: 7,
              fontSize: 12,
              fontWeight: 600,
              color: range === r ? 'var(--acc)' : 'var(--tx-2)',
              background: range === r ? 'var(--acc-soft)' : 'var(--panel)',
              border: `1px solid ${range === r ? 'var(--acc-line)' : 'var(--line-2)'}`,
            }}
          >
            {r}
          </button>
        ))}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
        <ChartCard title="CPU kullanımı" color={statusColor} series={c.cpuSeries} value={exited ? '0%' : c.cpu + '%'} max={100} />
        <ChartCard title="Bellek kullanımı" color="var(--acc)" series={c.memSeries} value={exited ? '0 MB' : c.mem + ' MB'} max={c.memLimit} />
        <ChartCard title="Network I/O" color="var(--info)" series={c.netSeries} value={exited ? '0' : c.net + ' MB/s'} />
        <ChartCard title="Disk I/O" color="#a78bfa" series={c.netSeries.map((v) => +(v * 0.4).toFixed(1))} value={exited ? '0' : (c.net * 0.4).toFixed(1) + ' MB/s'} />
      </div>
    </div>
  );
}

interface ChartCardProps {
  title: string;
  color: string;
  series: number[];
  value: string;
  max?: number;
}

function ChartCard({ title, color, series, value, max }: ChartCardProps) {
  return (
    <Card pad={18}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'baseline',
          marginBottom: 14,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <StatusDot color={color} size={8} />
          <span style={{ fontSize: 13.5, fontWeight: 600 }}>{title}</span>
        </div>
        <span className="mono tnum" style={{ fontSize: 16, fontWeight: 700, color }}>
          {value}
        </span>
      </div>
      <AreaChart data={series} color={color} max={max} />
    </Card>
  );
}

function InspectTab({ c, app }: { c: Container; app: App }) {
  const json: Record<string, unknown> = {
    Id: c.id + '9a3f2c1b7e',
    Name: '/' + c.name,
    Image: `${c.image}:${c.tag}`,
    State: { Status: c.status, Health: c.health, Restarts: c.restarts, ExitCode: c.exitCode || 0 },
    Config: { Hostname: c.name, Env: ['TZ=Europe/Istanbul', 'LOG_LEVEL=info'] },
    HostConfig: {
      Memory: c.memLimit + 'MB',
      NanoCpus: '2.0',
      RestartPolicy: 'unless-stopped',
      NetworkMode: app.name + '_default',
    },
    NetworkSettings: { Ports: c.ports, IPAddress: app.vm.ip },
  };

  const render = (obj: Record<string, unknown>, depth = 0): ReactNode =>
    Object.entries(obj).map(([k, v]) => (
      <div key={k} style={{ paddingLeft: depth * 18 }}>
        <span style={{ color: 'var(--acc-2)' }}>"{k}"</span>
        <span style={{ color: 'var(--tx-3)' }}>: </span>
        {typeof v === 'object' && v !== null && !Array.isArray(v) ? (
          <>
            {'{'}
            <div>{render(v as Record<string, unknown>, depth + 1)}</div>
            <span style={{ paddingLeft: depth * 18 }}>{'}'}</span>
          </>
        ) : (
          <span style={{ color: typeof v === 'number' ? 'var(--warn)' : 'var(--ok)' }}>
            {Array.isArray(v) ? `[${v.map((x) => `"${x}"`).join(', ')}]` : `"${v}"`}
          </span>
        )}
      </div>
    ));

  return (
    <Card pad={18}>
      <div className="mono" style={{ fontSize: 12.5, lineHeight: 1.85, color: 'var(--tx-1)' }}>
        {'{'}
        {render(json, 1)}
        {'}'}
      </div>
    </Card>
  );
}

function HealthTab({ c }: { c: Container }) {
  const checks = [
    {
      name: 'HTTP /health',
      target: 'GET localhost:8000/health',
      ok: c.status === 'running',
      detail: c.status === 'running' ? '200 OK · 1.2ms' : '503 / timeout',
    },
    {
      name: 'TCP port',
      target: c.ports,
      ok: c.status !== 'exited',
      detail: c.status !== 'exited' ? 'açık' : 'kapalı',
    },
    {
      name: 'Bellek headroom',
      target: `< ${c.memLimit}MB`,
      ok: c.memPct < 90,
      detail: `%${c.memPct} kullanımda`,
    },
    {
      name: 'Restart kararlılığı',
      target: '< 3 / 10dk',
      ok: c.restarts < 3,
      detail: `${c.restarts} restart`,
    },
  ];

  return (
    <Card pad={0} style={{ overflow: 'hidden' }}>
      {checks.map((ch, i) => (
        <div
          key={ch.name}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 14,
            padding: '15px 18px',
            borderBottom: i === checks.length - 1 ? 'none' : '1px solid var(--line)',
          }}
        >
          <div
            style={{
              width: 30,
              height: 30,
              borderRadius: 8,
              display: 'grid',
              placeItems: 'center',
              background: ch.ok ? 'var(--ok-soft)' : 'var(--crit-soft)',
              color: ch.ok ? 'var(--ok)' : 'var(--crit)',
            }}
          >
            <Icon name={ch.ok ? 'check' : 'x'} size={16} strokeW={2.4} />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 600, fontSize: 13.5 }}>{ch.name}</div>
            <div className="mono" style={{ fontSize: 11.5, color: 'var(--tx-3)', marginTop: 2 }}>
              {ch.target}
            </div>
          </div>
          <Badge
            color={ch.ok ? 'var(--ok)' : 'var(--crit)'}
            bg={ch.ok ? 'var(--ok-soft)' : 'var(--crit-soft)'}
            line={ch.ok ? 'var(--ok-line)' : 'var(--crit-line)'}
          >
            {ch.detail}
          </Badge>
        </div>
      ))}
    </Card>
  );
}
