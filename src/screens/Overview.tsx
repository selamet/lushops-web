import { AppCard } from '@/components/AppCard';
import { Button, Card, Eyebrow, Icon, type IconName } from '@/components/ui';
import { api } from '@/api/endpoints';
import { useAlarms } from '@/store/alarms';
import { useFleet } from '@/store/fleet';
import { useOverlay } from '@/store/overlay';

interface Kpi {
  label: string;
  value: string | number;
  sub: string;
  icon: IconName;
  color: string;
}

/** Fleet-wide health at a glance: KPI row plus the app card grid. */
export function Overview() {
  const apps = useFleet((s) => s.apps);
  const refreshFleet = useFleet((s) => s.refresh);
  const alarms = useAlarms((s) => s.alarms);
  const refreshAlarms = useAlarms((s) => s.refresh);
  const toast = useOverlay((s) => s.toast);

  const evaluateNow = async () => {
    try {
      const r = await api.evaluate();
      toast('Kurallar değerlendirildi', {
        type: 'success',
        sub: `${r.created} yeni · ${r.resolved} çözüldü · ${r.remediated} onarım`,
      });
    } catch {
      // viewers cannot trigger evaluation; still refresh below
    }
    await Promise.all([refreshFleet(), refreshAlarms()]);
  };

  const containers = apps.flatMap((a) => a.containers);
  const totalContainers = containers.length;
  const running = containers.filter((c) => c.status === 'running' && c.health !== 'unhealthy').length;
  const problem = totalContainers - running;
  const activeAlarms = alarms.filter((a) => a.state === 'active').length;
  const crit = alarms.filter((a) => a.state === 'active' && a.sev === 'critical').length;
  const runningContainers = containers.filter((c) => c.status === 'running');
  const avgCpu = Math.round(
    runningContainers.reduce((a, c) => a + c.cpu, 0) / (runningContainers.length || 1),
  );

  const kpis: Kpi[] = [
    {
      label: 'İzlenen uygulama',
      value: apps.length,
      sub: `${apps.filter((a) => a.env === 'prod').length} prod · ${apps.filter((a) => a.env === 'staging').length} staging`,
      icon: 'layers',
      color: 'var(--acc)',
    },
    {
      label: 'Çalışan container',
      value: `${running}/${totalContainers}`,
      sub: problem ? `${problem} sorunlu` : 'tümü sağlıklı',
      icon: 'server',
      color: problem ? 'var(--warn)' : 'var(--ok)',
    },
    {
      label: 'Aktif alarm',
      value: activeAlarms,
      sub: crit ? `${crit} kritik` : 'kritik yok',
      icon: 'bell',
      color: activeAlarms ? 'var(--crit)' : 'var(--ok)',
    },
    {
      label: 'Ort. CPU',
      value: avgCpu + '%',
      sub: 'tüm prod servisler',
      icon: 'cpu',
      color: 'var(--acc)',
    },
  ];

  return (
    <div className="fade-up" style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14 }}>
        {kpis.map((k, i) => (
          <Card key={i} pad={18}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <div className="mono" style={{ fontSize: 12, color: 'var(--tx-2)', fontWeight: 500 }}>
                  {k.label}
                </div>
                <div
                  className="tnum"
                  style={{ fontSize: 30, fontWeight: 800, marginTop: 8, letterSpacing: '-0.02em' }}
                >
                  {k.value}
                </div>
                <div style={{ fontSize: 12, color: 'var(--tx-2)', marginTop: 4 }}>{k.sub}</div>
              </div>
              <div
                style={{
                  width: 38,
                  height: 38,
                  borderRadius: 10,
                  display: 'grid',
                  placeItems: 'center',
                  background: 'var(--panel-hi)',
                  border: '1px solid var(--line-2)',
                  color: k.color,
                }}
              >
                <Icon name={k.icon} size={19} />
              </div>
            </div>
          </Card>
        ))}
      </div>

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginTop: 4,
        }}
      >
        <div>
          <Eyebrow>Uygulamalar</Eyebrow>
          <div style={{ fontSize: 17, fontWeight: 700, marginTop: 3 }}>Filo durumu</div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <Button icon="filter" variant="ghost" size="sm">
            Filtrele
          </Button>
          <Button icon="refresh" variant="ghost" size="sm" onClick={evaluateNow}>
            Yenile
          </Button>
        </div>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(380px, 1fr))',
          gap: 14,
        }}
      >
        {apps.map((app) => (
          <AppCard key={app.id} app={app} />
        ))}
      </div>
    </div>
  );
}
