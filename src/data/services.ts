import type {
  ServiceMeta,
  ServiceType,
  Severity,
  SeverityMeta,
  StatusKey,
  StatusMeta,
} from '@/types';

// Service type metadata — monogram chip + color.
export const SERVICES: Record<ServiceType, ServiceMeta> = {
  fastapi: { label: 'FastAPI', mono: 'FA', color: '#34d399', tint: 'rgba(52,211,153,0.14)' },
  django: { label: 'Django', mono: 'DJ', color: '#3fb98a', tint: 'rgba(63,185,138,0.14)' },
  nginx: { label: 'Nginx', mono: 'NG', color: '#4ec9b0', tint: 'rgba(78,201,176,0.14)' },
  postgres: { label: 'PostgreSQL', mono: 'PG', color: '#6b91ff', tint: 'rgba(107,145,255,0.14)' },
  redis: { label: 'Redis', mono: 'RD', color: '#f5556d', tint: 'rgba(245,85,109,0.14)' },
  celery: { label: 'Celery', mono: 'CE', color: '#a3d65c', tint: 'rgba(163,214,92,0.14)' },
  flower: { label: 'Flower', mono: 'FL', color: '#f59ec5', tint: 'rgba(245,158,197,0.14)' },
  rabbitmq: { label: 'RabbitMQ', mono: 'RB', color: '#f0883e', tint: 'rgba(240,136,62,0.14)' },
  gunicorn: { label: 'Gunicorn', mono: 'GU', color: '#4f7cff', tint: 'rgba(79,124,255,0.14)' },
};

export const STATUS: Record<StatusKey, StatusMeta> = {
  running: { label: 'running', color: 'var(--ok)', soft: 'var(--ok-soft)', line: 'var(--ok-line)' },
  unhealthy: {
    label: 'unhealthy',
    color: 'var(--warn)',
    soft: 'var(--warn-soft)',
    line: 'var(--warn-line)',
  },
  restarting: {
    label: 'restarting',
    color: 'var(--warn)',
    soft: 'var(--warn-soft)',
    line: 'var(--warn-line)',
  },
  exited: {
    label: 'exited',
    color: 'var(--crit)',
    soft: 'var(--crit-soft)',
    line: 'var(--crit-line)',
  },
  paused: {
    label: 'paused',
    color: 'var(--tx-2)',
    soft: 'var(--muted-soft)',
    line: 'var(--line-3)',
  },
};

export const SEV: Record<Severity, SeverityMeta> = {
  critical: { label: 'Kritik', color: 'var(--crit)', soft: 'var(--crit-soft)', line: 'var(--crit-line)' },
  warning: { label: 'Uyarı', color: 'var(--warn)', soft: 'var(--warn-soft)', line: 'var(--warn-line)' },
  info: { label: 'Bilgi', color: 'var(--info)', soft: 'var(--info-soft)', line: 'rgba(56,189,248,0.3)' },
};
