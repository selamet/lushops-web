import type { Container, LogLine } from '@/types';

/** Generate plausible log lines for a container based on its status. */
export function genLogs(c: Container): LogLine[] {
  const now = Date.now();
  const t = (s: number) => new Date(now - s * 1000).toTimeString().slice(0, 8);

  if (c.status === 'exited') {
    return [
      { lvl: 'info', t: t(95), m: `Starting worker ${c.name}` },
      { lvl: 'info', t: t(80), m: 'Connected to broker amqp://rabbitmq:5672' },
      { lvl: 'warn', t: t(40), m: 'Task batch_aggregate consuming 1.8GB RSS' },
      { lvl: 'warn', t: t(22), m: 'Memory pressure: 96% of cgroup limit' },
      { lvl: 'error', t: t(8), m: 'Worker received SIGKILL (OOMKilled)' },
      { lvl: 'error', t: t(6), m: 'Killed process 1 (python) total-vm:2.1GB' },
      { lvl: 'fatal', t: t(5), m: 'Container exited with code 137' },
    ];
  }

  if (c.status === 'restarting') {
    return [
      { lvl: 'info', t: t(60), m: `Booting ${c.name}` },
      { lvl: 'info', t: t(52), m: 'Registered tasks: [charge, refund, payout]' },
      { lvl: 'warn', t: t(30), m: 'Redis connection reset, retrying (2/5)' },
      { lvl: 'error', t: t(18), m: 'Healthcheck failed: /health returned 503' },
      { lvl: 'warn', t: t(9), m: 'Supervisor restarting worker (attempt 7)' },
      { lvl: 'info', t: t(3), m: 'Reconnecting to broker...' },
    ];
  }

  return [
    { lvl: 'info', t: t(48), m: `${c.name} ready, accepting connections` },
    { lvl: 'info', t: t(31), m: 'GET /health 200 1.2ms' },
    { lvl: 'info', t: t(22), m: 'POST /api/v1/charge 201 84ms' },
    { lvl: 'info', t: t(14), m: 'GET /metrics 200 0.8ms' },
    { lvl: 'warn', t: t(7), m: 'Slow query 412ms on table transactions' },
    { lvl: 'info', t: t(2), m: 'POST /api/v1/refund 200 61ms' },
  ];
}
