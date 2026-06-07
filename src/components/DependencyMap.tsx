import { useNavigate } from 'react-router-dom';
import { Card, Icon, ServiceChip, StatusDot } from '@/components/ui';
import { SERVICES, STATUS } from '@/data/services';
import { paths } from '@/lib/routes';
import type { App, Container, ServiceType } from '@/types';

type Column = 'edge' | 'app' | 'compute' | 'data';

const NW = 168;
const NH = 54;
const COLG = 64;
const ROWG = 16;
const PAD_Y = 8;

const COLUMN_LABELS: Record<Column, string> = {
  edge: 'ingress',
  app: 'uygulama',
  compute: 'işlem',
  data: 'veri',
};

/** Map a service to its topology column. */
function depColumn(svc: ServiceType): Column {
  if (svc === 'nginx') return 'edge';
  if (svc === 'fastapi' || svc === 'gunicorn' || svc === 'django') return 'app';
  if (svc === 'celery' || svc === 'flower') return 'compute';
  return 'data'; // postgres, redis, rabbitmq
}

interface Node {
  x: number;
  y: number;
  c: Container;
}

/** Left-to-right service topology with bezier links; problem nodes glow red. */
export function DependencyMap({ app }: { app: App }) {
  const navigate = useNavigate();

  const cols: Record<Column, Container[]> = { edge: [], app: [], compute: [], data: [] };
  app.containers.forEach((c) => cols[depColumn(c.svc)].push(c));

  const order = (['edge', 'app', 'compute', 'data'] as Column[]).filter((k) => cols[k].length);
  const colHeights = order.map((k) => cols[k].length * NH + (cols[k].length - 1) * ROWG);
  const maxH = Math.max(...colHeights, NH);
  const totalW = order.length * NW + (order.length - 1) * COLG;
  const totalH = maxH + PAD_Y * 2;

  const pos: Record<string, Node> = {};
  order.forEach((k, ci) => {
    const x = ci * (NW + COLG);
    const colH = cols[k].length * NH + (cols[k].length - 1) * ROWG;
    const startY = PAD_Y + (maxH - colH) / 2;
    cols[k].forEach((c, ri) => {
      pos[c.id] = { x, y: startY + ri * (NH + ROWG), c };
    });
  });

  const edges: Array<[string, string]> = [];
  cols.edge.forEach((e) => cols.app.forEach((a) => edges.push([e.id, a.id])));
  cols.app.forEach((a) => cols.data.forEach((d) => edges.push([a.id, d.id])));
  cols.compute.forEach((w) => {
    if (w.svc === 'celery')
      cols.data
        .filter((d) => d.svc === 'redis' || d.svc === 'rabbitmq')
        .forEach((d) => edges.push([w.id, d.id]));
    if (w.svc === 'flower')
      cols.compute.filter((x) => x.svc === 'celery').forEach((x) => edges.push([w.id, x.id]));
  });

  const path = (a: string, b: string) => {
    const x1 = pos[a].x + NW;
    const y1 = pos[a].y + NH / 2;
    const x2 = pos[b].x;
    const y2 = pos[b].y + NH / 2;
    const mx = (x1 + x2) / 2;
    return `M ${x1} ${y1} C ${mx} ${y1}, ${mx} ${y2}, ${x2} ${y2}`;
  };

  const isProblem = (c: Container) => c.status !== 'running' || c.health === 'unhealthy';

  return (
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
          <Icon name="net" size={16} color="var(--acc)" />
          <span style={{ fontSize: 14, fontWeight: 700 }}>Bağımlılık haritası</span>
        </div>
        <span className="mono" style={{ fontSize: 11, color: 'var(--tx-3)' }}>
          {order.map((k) => COLUMN_LABELS[k]).join(' → ')}
        </span>
      </div>
      <div style={{ overflowX: 'auto', paddingBottom: 4 }}>
        <div style={{ position: 'relative', width: totalW, height: totalH, minWidth: '100%' }}>
          <svg
            width={totalW}
            height={totalH}
            style={{ position: 'absolute', inset: 0, overflow: 'visible' }}
          >
            {edges.map(([a, b], i) => {
              const problem = isProblem(pos[a].c) || isProblem(pos[b].c);
              return (
                <path
                  key={i}
                  d={path(a, b)}
                  fill="none"
                  stroke={problem ? 'var(--crit-line)' : 'var(--line-3)'}
                  strokeWidth={problem ? 1.8 : 1.3}
                  strokeDasharray={problem ? '4 4' : 'none'}
                />
              );
            })}
          </svg>
          {Object.values(pos).map(({ x, y, c }) => {
            const problem = isProblem(c);
            const sCol = STATUS[c.status]?.color;
            return (
              <div
                key={c.id}
                onClick={() => navigate(paths.container(app.id, c.id))}
                style={{
                  position: 'absolute',
                  left: x,
                  top: y,
                  width: NW,
                  height: NH,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 9,
                  padding: '0 11px',
                  cursor: 'pointer',
                  background: 'var(--panel-2)',
                  border: `1px solid ${problem ? sCol + '88' : 'var(--line-2)'}`,
                  borderRadius: 10,
                  boxShadow: problem ? `0 0 18px -6px ${sCol}` : 'none',
                }}
              >
                <ServiceChip svc={c.svc} size={26} />
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div
                    className="mono"
                    style={{
                      fontSize: 11.5,
                      fontWeight: 600,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {c.name.split('_').slice(1).join('_') || c.name}
                  </div>
                  <div style={{ fontSize: 10, color: 'var(--tx-3)' }}>{SERVICES[c.svc]?.label}</div>
                </div>
                <StatusDot color={sCol} size={8} pulse={problem} />
              </div>
            );
          })}
        </div>
      </div>
    </Card>
  );
}
