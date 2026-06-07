import { useState } from 'react';
import { Bar, Card, Icon, ServiceChip, Sparkline, StatusPill } from '@/components/ui';
import { SERVICES, STATUS } from '@/data/services';
import type { Container } from '@/types';

const COLS = 'minmax(220px,1.6fr) 150px 120px 120px 110px 90px 96px';
const HEADERS = ['Container', 'Image : Tag', 'CPU', 'Bellek', 'Network', 'Restart', 'Durum'];

interface ContainerTableProps {
  containers: Container[];
  onSelect: (c: Container) => void;
}

/** Dense metrics table for an app's containers. */
export function ContainerTable({ containers, onSelect }: ContainerTableProps) {
  return (
    <Card pad={0} style={{ overflow: 'hidden' }}>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: COLS,
          alignItems: 'center',
          padding: '11px 18px',
          borderBottom: '1px solid var(--line)',
          background: 'var(--bg-1)',
        }}
      >
        {HEADERS.map((h) => (
          <div
            key={h}
            className="mono"
            style={{
              fontSize: 10.5,
              fontWeight: 600,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              color: 'var(--tx-3)',
            }}
          >
            {h}
          </div>
        ))}
      </div>
      {containers.map((c, idx) => (
        <ContainerRow key={c.id} c={c} onSelect={onSelect} last={idx === containers.length - 1} />
      ))}
      {!containers.length && (
        <div style={{ padding: 40, textAlign: 'center', color: 'var(--tx-3)' }}>
          Eşleşen container yok
        </div>
      )}
    </Card>
  );
}

interface ContainerRowProps {
  c: Container;
  onSelect: (c: Container) => void;
  last: boolean;
}

function ContainerRow({ c, onSelect, last }: ContainerRowProps) {
  const [h, setH] = useState(false);
  const problem = c.status !== 'running' || c.health === 'unhealthy';
  const statusColor = STATUS[c.status]?.color;
  const exited = c.status === 'exited';

  return (
    <div
      onClick={() => onSelect(c)}
      onMouseEnter={() => setH(true)}
      onMouseLeave={() => setH(false)}
      style={{
        display: 'grid',
        gridTemplateColumns: COLS,
        alignItems: 'center',
        padding: '13px 18px',
        borderBottom: last ? 'none' : '1px solid var(--line)',
        background: h ? 'var(--panel-hi)' : problem ? 'rgba(245,85,109,0.025)' : 'transparent',
        cursor: 'pointer',
        transition: 'background .14s',
        position: 'relative',
      }}
    >
      {problem && (
        <div
          style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 2.5, background: statusColor }}
        />
      )}
      <div style={{ display: 'flex', alignItems: 'center', gap: 11, minWidth: 0 }}>
        <ServiceChip svc={c.svc} size={30} />
        <div style={{ minWidth: 0 }}>
          <div
            className="mono"
            style={{
              fontSize: 13,
              fontWeight: 600,
              color: 'var(--tx-0)',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {c.name}
          </div>
          <div style={{ fontSize: 11, color: 'var(--tx-3)' }}>
            {SERVICES[c.svc]?.label} · {c.uptime !== '—' ? 'up ' + c.uptime : 'durdu'}
          </div>
        </div>
      </div>

      <div
        className="mono"
        style={{
          fontSize: 11.5,
          color: 'var(--tx-2)',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}
      >
        <span style={{ color: 'var(--tx-1)' }}>{c.image.split('/').pop()}</span>
        <span style={{ color: 'var(--acc-2)' }}>:{c.tag}</span>
      </div>

      <MetricCell value={c.cpu} unit="%" series={c.cpuSeries} color={statusColor} dim={exited} />

      <div style={{ paddingRight: 14 }}>
        <div
          className="mono tnum"
          style={{ fontSize: 12.5, color: exited ? 'var(--tx-3)' : 'var(--tx-0)', fontWeight: 600 }}
        >
          {exited ? '—' : `${c.mem}`}
          <span style={{ color: 'var(--tx-3)', fontWeight: 400 }}>
            {exited ? '' : `/${c.memLimit}MB`}
          </span>
        </div>
        {!exited && (
          <div style={{ marginTop: 5 }}>
            <Bar value={c.memPct} h={4} />
          </div>
        )}
      </div>

      <div
        className="mono tnum"
        style={{ fontSize: 12.5, color: exited ? 'var(--tx-3)' : 'var(--tx-1)' }}
      >
        {exited ? '—' : `${c.net}`}
        <span style={{ color: 'var(--tx-3)', fontSize: 10.5 }}>{exited ? '' : ' MB/s'}</span>
      </div>

      <div
        className="mono tnum"
        style={{
          fontSize: 13,
          fontWeight: 600,
          color: c.restarts > 3 ? 'var(--crit)' : c.restarts > 0 ? 'var(--warn)' : 'var(--tx-2)',
        }}
      >
        {c.restarts > 3 && (
          <Icon
            name="restart"
            size={12}
            color="var(--crit)"
            style={{ marginRight: 4, verticalAlign: '-1px' }}
          />
        )}
        {c.restarts}
      </div>

      <div>
        <StatusPill status={c.status} pulse={c.status === 'restarting'} />
      </div>
    </div>
  );
}

interface MetricCellProps {
  value: number;
  unit: string;
  series: number[];
  color: string;
  dim: boolean;
}

function MetricCell({ value, unit, series, color, dim }: MetricCellProps) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 9, paddingRight: 10 }}>
      <div
        className="mono tnum"
        style={{ fontSize: 12.5, fontWeight: 600, color: dim ? 'var(--tx-3)' : 'var(--tx-0)', width: 38 }}
      >
        {dim ? '—' : value}
        {!dim && <span style={{ color: 'var(--tx-3)', fontWeight: 400 }}>{unit}</span>}
      </div>
      {!dim && <Sparkline data={series} color={color} w={42} h={22} fill={false} strokeW={1.4} />}
    </div>
  );
}
