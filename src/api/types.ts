// Response shapes returned by the Sentinel backend (camelCase, as serialized).

export type ApiRole = 'admin' | 'operator' | 'viewer';

export interface ApiUser {
  id: string;
  email: string;
  fullName: string;
  role: ApiRole;
  isActive: boolean;
  createdAt: string;
}

export interface ApiToken {
  accessToken: string;
  tokenType: string;
}

export type OrgRole = 'owner' | 'member';

export interface ApiOrganization {
  id: string;
  name: string;
  slug: string;
  role: OrgRole;
  createdAt: string;
  updatedAt: string;
}

export type CloudProvider = 'gcp' | 'aws' | 'azure' | 'other';
export type AuthMethod = 'sa' | 'iam' | 'sp' | 'ssh' | 'iap' | 'key';

export interface ApiVm {
  instance: string;
  zone: string;
  machine: string | null;
  ip: string | null;
  os: string | null;
}

export interface ApiApp {
  id: string;
  organizationId: string;
  name: string;
  env: 'prod' | 'staging' | 'dev';
  description: string;
  health: 'ok' | 'warn' | 'crit';
  vm: ApiVm;
  provider: CloudProvider;
  project: string;
  authMethod: AuthMethod;
  composePath: string;
  collectInterval: number;
  createdAt: string;
  updatedAt: string;
}

export interface ApiContainer {
  id: string;
  appId: string;
  name: string;
  serviceType: string;
  image: string;
  tag: string;
  status: 'running' | 'restarting' | 'exited' | 'paused';
  health: 'healthy' | 'unhealthy';
  cpu: number;
  mem: number;
  memLimit: number;
  memPct: number;
  net: number;
  uptime: string;
  restarts: number;
  ports: string;
  exitCode: number | null;
  exitReason: string | null;
}

export interface ApiAction {
  id: string;
  containerId: string;
  action: 'restart' | 'stop' | 'start';
  command: string;
  status: 'pending' | 'success' | 'failed';
  requestedBy: string | null;
  createdAt: string;
}

export interface ApiMetric {
  cpu: number;
  memPct: number;
  net: number;
  recordedAt: string;
}

export interface ApiLog {
  level: 'info' | 'warn' | 'error' | 'fatal';
  message: string;
  recordedAt: string;
}

export interface ApiTimelineEvent {
  kind: string;
  title: string;
  detail: string;
  occurredAt: string;
}

export interface ApiAlarm {
  id: string;
  appId: string;
  containerId: string | null;
  severity: 'critical' | 'warning' | 'info';
  state: 'active' | 'acknowledged' | 'resolved';
  title: string;
  detail: string;
  rule: string;
  auto: boolean;
  triggeredAt: string;
  acknowledgedAt: string | null;
  resolvedAt: string | null;
  acknowledgedBy: string | null;
  createdAt: string;
}

export interface ApiAlarmDetail extends ApiAlarm {
  events: ApiTimelineEvent[];
}

export interface ApiAlarmRule {
  id: string;
  metric: string;
  operator: string;
  threshold: string;
  severity: 'critical' | 'warning' | 'info';
  enabled: boolean;
}

export interface ApiRemediationRule {
  id: string;
  condition: string;
  action: string;
  command: string;
  enabled: boolean;
  runCount: number;
  lastRunAt: string | null;
}

export interface ApiChannel {
  id: string;
  type: 'slack' | 'email' | 'telegram' | 'webhook' | 'pagerduty';
  enabled: boolean;
  config: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface ApiSettings {
  dataRetentionDays: number;
  defaultInterval: number;
  quietHoursEnabled: boolean;
  quietHoursStart: string;
  quietHoursEnd: string;
  autoRemediationEnabled: boolean;
}
