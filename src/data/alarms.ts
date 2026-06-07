import type { Alarm } from '@/types';

export const ALARMS: Alarm[] = [
  { id: 'a1', sev: 'critical', app: 'analytics-pipeline', container: 'analytics_etl_worker', title: 'Container exited — OOMKilled (137)', detail: 'Bellek limiti 2048MB aşıldı, süreç kernel tarafından sonlandırıldı. 12 yeniden başlatma denemesi.', ts: '2 dk önce', state: 'active', rule: 'container.status == exited' },
  { id: 'a2', sev: 'critical', app: 'payments-api', container: 'payments_celery_worker', title: 'Restart loop algılandı', detail: 'Son 10 dakikada 7 yeniden başlatma. Health check başarısız.', ts: '5 dk önce', state: 'active', rule: 'restarts > 5 / 10dk' },
  { id: 'a3', sev: 'warning', app: 'notify-gateway', container: 'notify_fastapi', title: 'CPU eşiği aşıldı — %88', detail: '5 dakikadır %85 üzerinde. Eşik: %80.', ts: '8 dk önce', state: 'active', rule: 'cpu > 80% / 5dk' },
  { id: 'a4', sev: 'warning', app: 'notify-gateway', container: 'notify_fastapi', title: 'Bellek eşiği aşıldı — %92', detail: 'Limit 512MB, kullanım 470MB. OOM riski.', ts: '8 dk önce', state: 'active', rule: 'mem > 90%' },
  { id: 'a5', sev: 'warning', app: 'analytics-pipeline', container: 'analytics_postgres', title: 'Bellek kullanımı yüksek — %79', detail: 'Limit 2048MB, kullanım 1620MB.', ts: '21 dk önce', state: 'acknowledged', rule: 'mem > 75%' },
  { id: 'a6', sev: 'info', app: 'orders-service', container: 'orders_celery_worker', title: 'Container yeniden başlatıldı', detail: 'Planlı deploy sonrası tek restart. Sağlıklı.', ts: '1 sa önce', state: 'resolved', rule: 'deploy.restart' },
  { id: 'a7', sev: 'warning', app: 'payments-api', container: 'payments_postgres', title: 'Bağlantı havuzu %85', detail: 'max_connections 100, aktif 85.', ts: '2 sa önce', state: 'resolved', rule: 'pg.connections > 80%' },
];
