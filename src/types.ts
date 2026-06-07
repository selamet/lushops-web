// ============ Sentinel domain model ============
// Mirrors the mock schema from the design handoff. Map these to the real
// API responses when wiring up live data.

export type ServiceType =
  | 'fastapi'
  | 'django'
  | 'nginx'
  | 'postgres'
  | 'redis'
  | 'celery'
  | 'flower'
  | 'rabbitmq'
  | 'gunicorn';

export type ContainerStatus = 'running' | 'restarting' | 'exited' | 'paused';

/** Status keys usable by the status pill — container statuses plus `unhealthy`. */
export type StatusKey = ContainerStatus | 'unhealthy';

export type ContainerHealth = 'healthy' | 'unhealthy';

export type AppHealth = 'ok' | 'warn' | 'crit';

export type Environment = 'prod' | 'staging' | 'dev';

export type Severity = 'critical' | 'warning' | 'info';

export type AlarmState = 'active' | 'acknowledged' | 'resolved';

export type LogLevel = 'info' | 'warn' | 'error' | 'fatal';

export interface ServiceMeta {
  label: string;
  mono: string;
  color: string;
  tint: string;
}

export interface StatusMeta {
  label: string;
  color: string;
  soft: string;
  line: string;
}

export interface SeverityMeta {
  label: string;
  color: string;
  soft: string;
  line: string;
}

export interface VmInfo {
  instance: string;
  zone: string;
  machine: string;
  ip: string;
  os: string;
}

export interface Container {
  id: string;
  name: string;
  svc: ServiceType;
  image: string;
  tag: string;
  status: ContainerStatus;
  cpu: number;
  mem: number;
  memLimit: number;
  memPct: number;
  net: number;
  uptime: string;
  restarts: number;
  health: ContainerHealth;
  ports: string;
  exitCode?: number;
  exitReason?: string;
  cpuSeries: number[];
  memSeries: number[];
  netSeries: number[];
}

export interface App {
  id: string;
  name: string;
  env: Environment;
  desc: string;
  vm: VmInfo;
  compose: string;
  health: AppHealth;
  containers: Container[];
}

export interface Alarm {
  id: string;
  sev: Severity;
  app: string;
  container: string;
  title: string;
  detail: string;
  ts: string;
  state: AlarmState;
  rule: string;
}

export interface LogLine {
  lvl: LogLevel;
  t: string;
  m: string;
}
