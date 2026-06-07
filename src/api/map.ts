import { series } from '@/lib/series';
import type {
  Alarm,
  AlarmState,
  App,
  AppHealth,
  Container,
  ContainerHealth,
  ContainerStatus,
  Environment,
  ServiceType,
  Severity,
} from '@/types';
import type { ApiAlarm, ApiApp, ApiContainer } from './types';

/** Stable numeric seed from an id so synthesized sparklines stay steady across renders. */
function seedFromId(id: string): number {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) % 233280;
  return h || 1;
}

/** Turkish relative timestamp for alarm rows (e.g. "5 dk önce"). */
export function relativeTime(iso: string): string {
  const minutes = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (minutes < 1) return 'az önce';
  if (minutes < 60) return `${minutes} dk önce`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} sa önce`;
  const days = Math.floor(hours / 24);
  return days === 1 ? 'dün' : `${days} g önce`;
}

/** API container → frontend Container. Metric history is synthesized from current values. */
export function mapContainer(c: ApiContainer): Container {
  const seed = seedFromId(c.id);
  return {
    id: c.id,
    name: c.name,
    svc: c.serviceType as ServiceType,
    image: c.image,
    tag: c.tag,
    status: c.status as ContainerStatus,
    cpu: c.cpu,
    mem: c.mem,
    memLimit: c.memLimit,
    memPct: c.memPct,
    net: c.net,
    uptime: c.uptime,
    restarts: c.restarts,
    health: c.health as ContainerHealth,
    ports: c.ports,
    exitCode: c.exitCode ?? undefined,
    exitReason: c.exitReason ?? undefined,
    cpuSeries: series(seed, 40, c.cpu, c.cpu * 0.5, 0),
    memSeries: series(seed + 7, 40, c.memPct, c.memPct * 0.3, 0),
    netSeries: series(seed + 13, 40, c.net, c.net * 0.6, 0),
  };
}

/** API app → frontend App. Uses the unique name slug as the id for readable routes. */
export function mapApp(a: ApiApp, containers: Container[]): App {
  return {
    id: a.name,
    name: a.name,
    env: a.env as Environment,
    desc: a.description,
    vm: {
      instance: a.vm.instance,
      zone: a.vm.zone,
      machine: a.vm.machine ?? '—',
      ip: a.vm.ip ?? '—',
      os: a.vm.os ?? '—',
    },
    compose: a.composePath,
    health: a.health as AppHealth,
    containers,
  };
}

/** API alarm → frontend Alarm. App/container ids are resolved to display names. */
export function mapAlarm(a: ApiAlarm, appName: string, containerName: string): Alarm {
  return {
    id: a.id,
    sev: a.severity as Severity,
    app: appName,
    container: containerName,
    title: a.title,
    detail: a.detail,
    ts: relativeTime(a.triggeredAt),
    state: a.state as AlarmState,
    rule: a.rule,
    auto: a.auto,
  };
}
