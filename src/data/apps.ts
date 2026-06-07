import type { App, Container } from '@/types';
import { series } from '@/lib/series';

/** Stable numeric seed from a container id so sparklines render deterministically. */
function seedFromId(id: string): number {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) % 233280;
  return h || 1;
}

type ContainerSeed = Omit<Container, 'cpuSeries' | 'memSeries' | 'netSeries'>;

/** Attach deterministic metric series to a container definition. */
function mkContainer(o: ContainerSeed): Container {
  const seed = seedFromId(o.id);
  return {
    ...o,
    cpuSeries: series(seed, 40, o.cpu, o.cpu * 0.5, 0),
    memSeries: series(seed + 7, 40, o.memPct, o.memPct * 0.3, 0),
    netSeries: series(seed + 13, 40, o.net, o.net * 0.6, 0),
  };
}

export const APPS: App[] = [
  {
    id: 'payments-api',
    name: 'payments-api',
    env: 'prod',
    desc: 'Stripe & iyzico ödeme orkestrasyonu',
    vm: {
      instance: 'vm-pay-prod-1',
      zone: 'europe-west1-b',
      machine: 'e2-standard-4',
      ip: '10.164.0.12',
      os: 'Container-Optimized OS 113',
    },
    compose: 'docker-compose.prod.yml',
    health: 'warn',
    containers: [
      mkContainer({ id: 'pay-fastapi', name: 'payments_fastapi', svc: 'fastapi', image: 'registry/payments-api', tag: 'v2.8.1', status: 'running', cpu: 41, mem: 612, memLimit: 1024, memPct: 60, net: 8.4, uptime: '6g 4s', restarts: 0, health: 'healthy', ports: '8000→8000' }),
      mkContainer({ id: 'pay-nginx', name: 'payments_nginx', svc: 'nginx', image: 'nginx', tag: '1.27-alpine', status: 'running', cpu: 6, mem: 48, memLimit: 256, memPct: 19, net: 12.1, uptime: '6g 4s', restarts: 0, health: 'healthy', ports: '443→443' }),
      mkContainer({ id: 'pay-pg', name: 'payments_postgres', svc: 'postgres', image: 'postgres', tag: '16.3', status: 'running', cpu: 22, mem: 1340, memLimit: 2048, memPct: 65, net: 3.2, uptime: '14g 8s', restarts: 0, health: 'healthy', ports: '5432' }),
      mkContainer({ id: 'pay-redis', name: 'payments_redis', svc: 'redis', image: 'redis', tag: '7.4-alpine', status: 'running', cpu: 4, mem: 96, memLimit: 512, memPct: 18, net: 5.5, uptime: '14g 8s', restarts: 0, health: 'healthy', ports: '6379' }),
      mkContainer({ id: 'pay-celery', name: 'payments_celery_worker', svc: 'celery', image: 'registry/payments-api', tag: 'v2.8.1', status: 'restarting', cpu: 78, mem: 890, memLimit: 1024, memPct: 87, net: 2.1, uptime: '2d', restarts: 7, health: 'unhealthy', ports: '—' }),
      mkContainer({ id: 'pay-flower', name: 'payments_flower', svc: 'flower', image: 'mher/flower', tag: '2.0', status: 'running', cpu: 3, mem: 72, memLimit: 256, memPct: 28, net: 1.2, uptime: '6g 4s', restarts: 0, health: 'healthy', ports: '5555' }),
    ],
  },
  {
    id: 'orders-service',
    name: 'orders-service',
    env: 'prod',
    desc: 'Sipariş & kargo entegrasyon servisi',
    vm: {
      instance: 'vm-orders-prod-1',
      zone: 'europe-west1-c',
      machine: 'e2-standard-2',
      ip: '10.164.0.21',
      os: 'Container-Optimized OS 113',
    },
    compose: 'docker-compose.prod.yml',
    health: 'ok',
    containers: [
      mkContainer({ id: 'ord-django', name: 'orders_gunicorn', svc: 'gunicorn', image: 'registry/orders', tag: 'v4.1.0', status: 'running', cpu: 34, mem: 720, memLimit: 1536, memPct: 47, net: 9.1, uptime: '11g 2s', restarts: 0, health: 'healthy', ports: '8000' }),
      mkContainer({ id: 'ord-nginx', name: 'orders_nginx', svc: 'nginx', image: 'nginx', tag: '1.27-alpine', status: 'running', cpu: 5, mem: 40, memLimit: 256, memPct: 16, net: 14.0, uptime: '11g 2s', restarts: 0, health: 'healthy', ports: '443→443' }),
      mkContainer({ id: 'ord-pg', name: 'orders_postgres', svc: 'postgres', image: 'postgres', tag: '16.3', status: 'running', cpu: 18, mem: 980, memLimit: 2048, memPct: 48, net: 2.8, uptime: '20g', restarts: 0, health: 'healthy', ports: '5432' }),
      mkContainer({ id: 'ord-redis', name: 'orders_redis', svc: 'redis', image: 'redis', tag: '7.4-alpine', status: 'running', cpu: 3, mem: 64, memLimit: 512, memPct: 12, net: 4.1, uptime: '20g', restarts: 0, health: 'healthy', ports: '6379' }),
      mkContainer({ id: 'ord-celery', name: 'orders_celery_worker', svc: 'celery', image: 'registry/orders', tag: 'v4.1.0', status: 'running', cpu: 28, mem: 540, memLimit: 1024, memPct: 53, net: 1.9, uptime: '11g 2s', restarts: 1, health: 'healthy', ports: '—' }),
    ],
  },
  {
    id: 'analytics-pipeline',
    name: 'analytics-pipeline',
    env: 'staging',
    desc: 'Olay toplama & ETL işleri',
    vm: {
      instance: 'vm-analytics-stg',
      zone: 'europe-west3-a',
      machine: 'e2-standard-4',
      ip: '10.156.0.8',
      os: 'Container-Optimized OS 109',
    },
    compose: 'docker-compose.staging.yml',
    health: 'crit',
    containers: [
      mkContainer({ id: 'an-fastapi', name: 'analytics_ingest_api', svc: 'fastapi', image: 'registry/analytics', tag: 'v1.3.2', status: 'running', cpu: 52, mem: 700, memLimit: 1024, memPct: 68, net: 18.2, uptime: '3g 1s', restarts: 0, health: 'healthy', ports: '8080' }),
      mkContainer({ id: 'an-worker', name: 'analytics_etl_worker', svc: 'celery', image: 'registry/analytics', tag: 'v1.3.2', status: 'exited', cpu: 0, mem: 0, memLimit: 2048, memPct: 0, net: 0, uptime: '—', restarts: 12, health: 'unhealthy', ports: '—', exitCode: 137, exitReason: 'OOMKilled' }),
      mkContainer({ id: 'an-pg', name: 'analytics_postgres', svc: 'postgres', image: 'postgres', tag: '16.3', status: 'running', cpu: 31, mem: 1620, memLimit: 2048, memPct: 79, net: 6.0, uptime: '8g', restarts: 0, health: 'healthy', ports: '5432' }),
      mkContainer({ id: 'an-rabbit', name: 'analytics_rabbitmq', svc: 'rabbitmq', image: 'rabbitmq', tag: '3.13-management', status: 'running', cpu: 12, mem: 410, memLimit: 1024, memPct: 40, net: 7.3, uptime: '8g', restarts: 0, health: 'healthy', ports: '5672 / 15672' }),
    ],
  },
  {
    id: 'notify-gateway',
    name: 'notify-gateway',
    env: 'prod',
    desc: 'Push / SMS / e-posta dağıtım kapısı',
    vm: {
      instance: 'vm-notify-prod',
      zone: 'europe-west1-b',
      machine: 'e2-medium',
      ip: '10.164.0.33',
      os: 'Container-Optimized OS 113',
    },
    compose: 'docker-compose.prod.yml',
    health: 'warn',
    containers: [
      mkContainer({ id: 'nt-fastapi', name: 'notify_fastapi', svc: 'fastapi', image: 'registry/notify', tag: 'v0.9.4', status: 'running', cpu: 88, mem: 470, memLimit: 512, memPct: 92, net: 22.5, uptime: '4g 9s', restarts: 0, health: 'healthy', ports: '8000' }),
      mkContainer({ id: 'nt-nginx', name: 'notify_nginx', svc: 'nginx', image: 'nginx', tag: '1.27-alpine', status: 'running', cpu: 7, mem: 44, memLimit: 256, memPct: 17, net: 16.4, uptime: '4g 9s', restarts: 0, health: 'healthy', ports: '443→443' }),
      mkContainer({ id: 'nt-rabbit', name: 'notify_rabbitmq', svc: 'rabbitmq', image: 'rabbitmq', tag: '3.13-management', status: 'running', cpu: 14, mem: 380, memLimit: 1024, memPct: 37, net: 9.8, uptime: '9g', restarts: 0, health: 'healthy', ports: '5672 / 15672' }),
      mkContainer({ id: 'nt-redis', name: 'notify_redis', svc: 'redis', image: 'redis', tag: '7.4-alpine', status: 'running', cpu: 5, mem: 88, memLimit: 512, memPct: 17, net: 6.2, uptime: '9g', restarts: 0, health: 'healthy', ports: '6379' }),
    ],
  },
  {
    id: 'auth-service',
    name: 'auth-service',
    env: 'prod',
    desc: 'Kimlik, OAuth ve oturum yönetimi',
    vm: {
      instance: 'vm-auth-prod',
      zone: 'europe-west1-c',
      machine: 'e2-standard-2',
      ip: '10.164.0.41',
      os: 'Container-Optimized OS 113',
    },
    compose: 'docker-compose.prod.yml',
    health: 'ok',
    containers: [
      mkContainer({ id: 'au-django', name: 'auth_gunicorn', svc: 'gunicorn', image: 'registry/auth', tag: 'v3.0.2', status: 'running', cpu: 26, mem: 560, memLimit: 1024, memPct: 55, net: 10.2, uptime: '18g', restarts: 0, health: 'healthy', ports: '8000' }),
      mkContainer({ id: 'au-nginx', name: 'auth_nginx', svc: 'nginx', image: 'nginx', tag: '1.27-alpine', status: 'running', cpu: 4, mem: 38, memLimit: 256, memPct: 15, net: 11.7, uptime: '18g', restarts: 0, health: 'healthy', ports: '443→443' }),
      mkContainer({ id: 'au-pg', name: 'auth_postgres', svc: 'postgres', image: 'postgres', tag: '16.3', status: 'running', cpu: 15, mem: 870, memLimit: 2048, memPct: 42, net: 2.4, uptime: '30g', restarts: 0, health: 'healthy', ports: '5432' }),
      mkContainer({ id: 'au-redis', name: 'auth_redis', svc: 'redis', image: 'redis', tag: '7.4-alpine', status: 'running', cpu: 3, mem: 70, memLimit: 512, memPct: 14, net: 3.9, uptime: '30g', restarts: 0, health: 'healthy', ports: '6379' }),
    ],
  },
];
