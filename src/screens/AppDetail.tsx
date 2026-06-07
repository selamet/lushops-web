import { useState } from 'react';
import { Navigate, useNavigate, useParams } from 'react-router-dom';
import { ContainerTable } from '@/components/ContainerTable';
import { DependencyMap } from '@/components/DependencyMap';
import { Badge, Button, Card, Icon, type IconName } from '@/components/ui';
import {
  appHealthColor,
  appHealthLabel,
  appHealthLine,
  appHealthSoft,
} from '@/lib/health';
import { paths } from '@/lib/routes';
import { useOverlay } from '@/store/overlay';
import { useFleet } from '@/store/fleet';
import type { ContainerStatus } from '@/types';

interface StatusTab {
  k: ContainerStatus | 'all';
  label: string;
  n: number;
}

/** App detail: VM info, dependency topology and the filterable container table. */
export function AppDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const apps = useFleet((s) => s.apps);
  const loaded = useFleet((s) => s.loaded);
  const { openTerminal, confirmAction, toast } = useOverlay();
  const [q, setQ] = useState('');
  const [statusFilter, setStatusFilter] = useState<ContainerStatus | 'all'>('all');

  const app = apps.find((a) => a.id === id);
  if (!loaded) return null;
  if (!app) return <Navigate to={paths.overview()} replace />;

  const hc = appHealthColor(app.health);

  const filtered = app.containers.filter((c) => {
    if (statusFilter !== 'all' && c.status !== statusFilter) return false;
    if (q && !`${c.name} ${c.image} ${c.svc}`.toLowerCase().includes(q.toLowerCase())) return false;
    return true;
  });

  const statTabs: StatusTab[] = [
    { k: 'all', label: 'Tümü', n: app.containers.length },
    { k: 'running', label: 'Çalışan', n: app.containers.filter((c) => c.status === 'running').length },
    {
      k: 'restarting',
      label: 'Yeniden başlıyor',
      n: app.containers.filter((c) => c.status === 'restarting').length,
    },
    { k: 'exited', label: 'Durmuş', n: app.containers.filter((c) => c.status === 'exited').length },
  ];

  const vmCells: Array<[string, string, IconName]> = [
    ['VM Instance', app.vm.instance, 'server'],
    ['Zone', app.vm.zone, 'net'],
    ['Makine tipi', app.vm.machine, 'cpu'],
    ['Dahili IP', app.vm.ip, 'shield'],
    ['İşletim sistemi', app.vm.os, 'disk'],
  ];

  return (
    <div className="fade-up" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            fontSize: 12.5,
            color: 'var(--tx-2)',
            marginBottom: 12,
          }}
        >
          <span className="mono" style={{ cursor: 'pointer' }} onClick={() => navigate(paths.overview())}>
            overview
          </span>
          <Icon name="chevR" size={13} color="var(--tx-3)" />
          <span className="mono" style={{ color: 'var(--tx-1)' }}>
            {app.name}
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
            <div
              style={{
                width: 46,
                height: 46,
                borderRadius: 12,
                display: 'grid',
                placeItems: 'center',
                background: 'var(--panel-hi)',
                border: `1px solid ${hc}40`,
                color: hc,
              }}
            >
              <Icon name="layers" size={22} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <h1
                  className="mono"
                  style={{
                    margin: 0,
                    fontSize: 22,
                    fontWeight: 700,
                    letterSpacing: '-0.01em',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {app.name}
                </h1>
                <Badge color={hc} bg={appHealthSoft(app.health)} line={appHealthLine(app.health)} dot>
                  {appHealthLabel(app.health)}
                </Badge>
              </div>
              <div style={{ fontSize: 13, color: 'var(--tx-2)', marginTop: 4 }}>{app.desc}</div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <Button icon="terminal" variant="ghost" size="sm" onClick={() => openTerminal(app.containers[0])}>
              SSH
            </Button>
            <Button icon="doc" variant="ghost" size="sm">
              {app.compose}
            </Button>
            <Button
              icon="refresh"
              variant="primary"
              size="sm"
              onClick={() =>
                confirmAction({
                  title: 'Compose pull & up?',
                  desc: `${app.name} için en güncel image'lar çekilip container'lar yeniden oluşturulacak.`,
                  cmd: `docker compose -f ${app.compose} pull && up -d`,
                  confirmLabel: 'Çalıştır',
                  confirmIcon: 'refresh',
                  icon: 'refresh',
                  onConfirm: () =>
                    toast(`${app.name} · compose up tamamlandı`, {
                      type: 'success',
                      sub: "image'lar güncel",
                    }),
                })
              }
            >
              Compose pull & up
            </Button>
          </div>
        </div>
      </div>

      <Card pad={0}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)' }}>
          {vmCells.map(([l, v, ic], i) => (
            <div key={l} style={{ padding: '15px 18px', borderLeft: i ? '1px solid var(--line)' : 'none' }}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 7,
                  fontSize: 11,
                  color: 'var(--tx-3)',
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                }}
              >
                <Icon name={ic} size={13} color="var(--tx-3)" />
                {l}
              </div>
              <div
                className="mono"
                style={{ fontSize: 13, color: 'var(--tx-1)', marginTop: 6, fontWeight: 500 }}
              >
                {v}
              </div>
            </div>
          ))}
        </div>
      </Card>

      <DependencyMap app={app} />

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 14,
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
          {statTabs.map((t) => (
            <button
              key={t.k}
              onClick={() => setStatusFilter(t.k)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 7,
                padding: '6px 12px',
                borderRadius: 7,
                fontSize: 12.5,
                fontWeight: 600,
                color: statusFilter === t.k ? 'var(--tx-0)' : 'var(--tx-2)',
                background: statusFilter === t.k ? 'var(--panel-hi)' : 'transparent',
                border: `1px solid ${statusFilter === t.k ? 'var(--line-2)' : 'transparent'}`,
                transition: 'all .15s',
              }}
            >
              {t.label}
              <span
                className="mono tnum"
                style={{
                  fontSize: 11,
                  padding: '1px 6px',
                  borderRadius: 999,
                  background: 'var(--bg-1)',
                  color: 'var(--tx-2)',
                }}
              >
                {t.n}
              </span>
            </button>
          ))}
        </div>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            background: 'var(--panel)',
            border: '1px solid var(--line-2)',
            borderRadius: 9,
            padding: '7px 12px',
            width: 260,
          }}
        >
          <Icon name="search" size={15} color="var(--tx-3)" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Container ara…"
            style={{
              flex: 1,
              background: 'none',
              border: 'none',
              outline: 'none',
              color: 'var(--tx-0)',
              fontSize: 13,
            }}
          />
        </div>
      </div>

      <ContainerTable
        containers={filtered}
        onSelect={(c) => navigate(paths.container(app.id, c.id))}
      />
    </div>
  );
}
