import { useNavigate } from 'react-router-dom';
import { Badge, Bar, Card, Icon, ServiceChip, Sparkline, StatusDot } from '@/components/ui';
import { STATUS } from '@/data/services';
import { appHealthColor, appHealthGlow, countStatuses } from '@/lib/health';
import { paths } from '@/lib/routes';
import type { App } from '@/types';

/** Fleet card: health stripe, service chips and rolled-up CPU/RAM metrics. */
export function AppCard({ app }: { app: App }) {
  const navigate = useNavigate();
  const sc = countStatuses(app);
  const hc = appHealthColor(app.health);
  const running = app.containers.filter((c) => c.status === 'running');
  const cpuAvg = Math.round(running.reduce((a, c) => a + c.cpu, 0) / (running.length || 1));
  const memAvg = Math.round(running.reduce((a, c) => a + c.memPct, 0) / (running.length || 1));
  const cpuSeries = app.containers[0]?.cpuSeries || [];

  return (
    <Card hover onClick={() => navigate(paths.app(app.id))} pad={0} style={{ overflow: 'hidden' }}>
      <div style={{ height: 3, background: hc, opacity: 0.9 }} />
      <div style={{ padding: 18 }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            gap: 12,
          }}
        >
          <div style={{ minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
              <StatusDot color={hc} size={9} glow={appHealthGlow(app.health)} pulse={app.health !== 'ok'} />
              <div
                className="mono"
                style={{
                  fontSize: 15.5,
                  fontWeight: 700,
                  color: 'var(--tx-0)',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {app.name}
              </div>
            </div>
            <div
              style={{
                fontSize: 12.5,
                color: 'var(--tx-2)',
                marginTop: 5,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {app.desc}
            </div>
          </div>
          <Badge
            color={app.env === 'prod' ? 'var(--acc-2)' : 'var(--tx-2)'}
            bg={app.env === 'prod' ? 'var(--acc-soft)' : 'var(--muted-soft)'}
            line={app.env === 'prod' ? 'var(--acc-line)' : 'var(--line-2)'}
          >
            {app.env}
          </Badge>
        </div>

        <div
          className="mono"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            marginTop: 13,
            fontSize: 11.5,
            color: 'var(--tx-3)',
          }}
        >
          <Icon name="server" size={13} color="var(--tx-3)" />
          <span style={{ color: 'var(--tx-2)' }}>{app.vm.instance}</span>
          <span>·</span>
          <span>{app.vm.zone}</span>
          <span>·</span>
          <span>{app.vm.machine}</span>
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 14 }}>
          {app.containers.map((c) => (
            <span key={c.id} style={{ position: 'relative' }}>
              <ServiceChip svc={c.svc} size={26} />
              <span
                style={{
                  position: 'absolute',
                  right: -2,
                  bottom: -2,
                  width: 9,
                  height: 9,
                  borderRadius: '50%',
                  background: STATUS[c.status]?.color,
                  border: '2px solid var(--panel)',
                }}
              />
            </span>
          ))}
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr auto',
            gap: 14,
            marginTop: 16,
            alignItems: 'center',
            paddingTop: 14,
            borderTop: '1px solid var(--line)',
          }}
        >
          <div>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                fontSize: 11,
                color: 'var(--tx-2)',
                marginBottom: 5,
              }}
            >
              <span>CPU</span>
              <span className="mono tnum" style={{ color: 'var(--tx-1)' }}>
                {cpuAvg}%
              </span>
            </div>
            <Bar value={cpuAvg} />
          </div>
          <div>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                fontSize: 11,
                color: 'var(--tx-2)',
                marginBottom: 5,
              }}
            >
              <span>RAM</span>
              <span className="mono tnum" style={{ color: 'var(--tx-1)' }}>
                {memAvg}%
              </span>
            </div>
            <Bar value={memAvg} />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ textAlign: 'right' }}>
              <div className="mono tnum" style={{ fontSize: 13, fontWeight: 700, color: hc }}>
                {sc.running}/{app.containers.length}
              </div>
              <div style={{ fontSize: 10, color: 'var(--tx-3)' }}>up</div>
            </div>
            <Sparkline data={cpuSeries} color={hc} w={56} h={30} />
          </div>
        </div>
      </div>
    </Card>
  );
}
