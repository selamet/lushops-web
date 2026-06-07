"""Load a demo fleet that mirrors the frontend mock data.

Run with: python -m app.seed
Creates an admin user plus apps, containers, alarms, rules and channels so the
dashboard has realistic data to render. Safe to skip if apps already exist.
"""

import asyncio
import random
from datetime import UTC, datetime, timedelta

from sqlalchemy import func, select

from app.core.database import Base, engine, session_factory
from app.core.security import hash_password
from app.modules.alarms.models import Alarm, AlarmState, Severity, TimelineEvent
from app.modules.apps.models import App, AppHealth, AuthMethod, Environment
from app.modules.auth.models import User, UserRole
from app.modules.containers.models import Container, ContainerHealth, ContainerStatus, ServiceType
from app.modules.metrics.models import MetricSample
from app.modules.notifications.models import ChannelType, NotificationChannel
from app.modules.rules.models import AlarmRule, RemediationRule

ADMIN_EMAIL = "admin@sentinel.dev"
ADMIN_PASSWORD = "changeme123"

APPS = [
    {
        "name": "payments-api",
        "env": Environment.prod,
        "description": "Stripe & iyzico payment orchestration",
        "health": AppHealth.warn,
        "compose_path": "docker-compose.prod.yml",
        "gcp_project": "acme-payments-prod",
        "vm": ("vm-pay-prod-1", "europe-west1-b", "e2-standard-4", "10.164.0.12", "Container-Optimized OS 113"),
        "containers": [
            ("payments_fastapi", ServiceType.fastapi, "registry/payments-api", "v2.8.1", ContainerStatus.running, ContainerHealth.healthy, 41, 612, 1024, 60, 8.4, "6d 4h", 0, "8000->8000", None, None),
            ("payments_nginx", ServiceType.nginx, "nginx", "1.27-alpine", ContainerStatus.running, ContainerHealth.healthy, 6, 48, 256, 19, 12.1, "6d 4h", 0, "443->443", None, None),
            ("payments_postgres", ServiceType.postgres, "postgres", "16.3", ContainerStatus.running, ContainerHealth.healthy, 22, 1340, 2048, 65, 3.2, "14d 8h", 0, "5432", None, None),
            ("payments_redis", ServiceType.redis, "redis", "7.4-alpine", ContainerStatus.running, ContainerHealth.healthy, 4, 96, 512, 18, 5.5, "14d 8h", 0, "6379", None, None),
            ("payments_celery_worker", ServiceType.celery, "registry/payments-api", "v2.8.1", ContainerStatus.restarting, ContainerHealth.unhealthy, 78, 890, 1024, 87, 2.1, "2d", 7, "—", None, None),
            ("payments_flower", ServiceType.flower, "mher/flower", "2.0", ContainerStatus.running, ContainerHealth.healthy, 3, 72, 256, 28, 1.2, "6d 4h", 0, "5555", None, None),
        ],
    },
    {
        "name": "orders-service",
        "env": Environment.prod,
        "description": "Order & shipping integration service",
        "health": AppHealth.ok,
        "compose_path": "docker-compose.prod.yml",
        "gcp_project": "acme-orders-prod",
        "vm": ("vm-orders-prod-1", "europe-west1-c", "e2-standard-2", "10.164.0.21", "Container-Optimized OS 113"),
        "containers": [
            ("orders_gunicorn", ServiceType.gunicorn, "registry/orders", "v4.1.0", ContainerStatus.running, ContainerHealth.healthy, 34, 720, 1536, 47, 9.1, "11d 2h", 0, "8000", None, None),
            ("orders_nginx", ServiceType.nginx, "nginx", "1.27-alpine", ContainerStatus.running, ContainerHealth.healthy, 5, 40, 256, 16, 14.0, "11d 2h", 0, "443->443", None, None),
            ("orders_postgres", ServiceType.postgres, "postgres", "16.3", ContainerStatus.running, ContainerHealth.healthy, 18, 980, 2048, 48, 2.8, "20d", 0, "5432", None, None),
            ("orders_redis", ServiceType.redis, "redis", "7.4-alpine", ContainerStatus.running, ContainerHealth.healthy, 3, 64, 512, 12, 4.1, "20d", 0, "6379", None, None),
            ("orders_celery_worker", ServiceType.celery, "registry/orders", "v4.1.0", ContainerStatus.running, ContainerHealth.healthy, 28, 540, 1024, 53, 1.9, "11d 2h", 1, "—", None, None),
        ],
    },
    {
        "name": "analytics-pipeline",
        "env": Environment.staging,
        "description": "Event collection & ETL jobs",
        "health": AppHealth.crit,
        "compose_path": "docker-compose.staging.yml",
        "gcp_project": "acme-analytics-stg",
        "vm": ("vm-analytics-stg", "europe-west3-a", "e2-standard-4", "10.156.0.8", "Container-Optimized OS 109"),
        "containers": [
            ("analytics_ingest_api", ServiceType.fastapi, "registry/analytics", "v1.3.2", ContainerStatus.running, ContainerHealth.healthy, 52, 700, 1024, 68, 18.2, "3d 1h", 0, "8080", None, None),
            ("analytics_etl_worker", ServiceType.celery, "registry/analytics", "v1.3.2", ContainerStatus.exited, ContainerHealth.unhealthy, 0, 0, 2048, 0, 0, "—", 12, "—", 137, "OOMKilled"),
            ("analytics_postgres", ServiceType.postgres, "postgres", "16.3", ContainerStatus.running, ContainerHealth.healthy, 31, 1620, 2048, 79, 6.0, "8d", 0, "5432", None, None),
            ("analytics_rabbitmq", ServiceType.rabbitmq, "rabbitmq", "3.13-management", ContainerStatus.running, ContainerHealth.healthy, 12, 410, 1024, 40, 7.3, "8d", 0, "5672 / 15672", None, None),
        ],
    },
    {
        "name": "notify-gateway",
        "env": Environment.prod,
        "description": "Push / SMS / email delivery gateway",
        "health": AppHealth.warn,
        "compose_path": "docker-compose.prod.yml",
        "gcp_project": "acme-notify-prod",
        "vm": ("vm-notify-prod", "europe-west1-b", "e2-medium", "10.164.0.33", "Container-Optimized OS 113"),
        "containers": [
            ("notify_fastapi", ServiceType.fastapi, "registry/notify", "v0.9.4", ContainerStatus.running, ContainerHealth.healthy, 88, 470, 512, 92, 22.5, "4d 9h", 0, "8000", None, None),
            ("notify_nginx", ServiceType.nginx, "nginx", "1.27-alpine", ContainerStatus.running, ContainerHealth.healthy, 7, 44, 256, 17, 16.4, "4d 9h", 0, "443->443", None, None),
            ("notify_rabbitmq", ServiceType.rabbitmq, "rabbitmq", "3.13-management", ContainerStatus.running, ContainerHealth.healthy, 14, 380, 1024, 37, 9.8, "9d", 0, "5672 / 15672", None, None),
            ("notify_redis", ServiceType.redis, "redis", "7.4-alpine", ContainerStatus.running, ContainerHealth.healthy, 5, 88, 512, 17, 6.2, "9d", 0, "6379", None, None),
        ],
    },
    {
        "name": "auth-service",
        "env": Environment.prod,
        "description": "Identity, OAuth and session management",
        "health": AppHealth.ok,
        "compose_path": "docker-compose.prod.yml",
        "gcp_project": "acme-auth-prod",
        "vm": ("vm-auth-prod", "europe-west1-c", "e2-standard-2", "10.164.0.41", "Container-Optimized OS 113"),
        "containers": [
            ("auth_gunicorn", ServiceType.gunicorn, "registry/auth", "v3.0.2", ContainerStatus.running, ContainerHealth.healthy, 26, 560, 1024, 55, 10.2, "18d", 0, "8000", None, None),
            ("auth_nginx", ServiceType.nginx, "nginx", "1.27-alpine", ContainerStatus.running, ContainerHealth.healthy, 4, 38, 256, 15, 11.7, "18d", 0, "443->443", None, None),
            ("auth_postgres", ServiceType.postgres, "postgres", "16.3", ContainerStatus.running, ContainerHealth.healthy, 15, 870, 2048, 42, 2.4, "30d", 0, "5432", None, None),
            ("auth_redis", ServiceType.redis, "redis", "7.4-alpine", ContainerStatus.running, ContainerHealth.healthy, 3, 70, 512, 14, 3.9, "30d", 0, "6379", None, None),
        ],
    },
]

ALARMS = [
    ("analytics-pipeline", "analytics_etl_worker", Severity.critical, "Container exited — OOMKilled (137)", "Memory limit of 2048MB exceeded; the process was killed by the kernel after 12 restart attempts.", AlarmState.active, "container.status == exited", 2),
    ("payments-api", "payments_celery_worker", Severity.critical, "Restart loop detected", "7 restarts in the last 10 minutes. Health check is failing.", AlarmState.active, "restarts > 5 / 10m", 5),
    ("notify-gateway", "notify_fastapi", Severity.warning, "CPU threshold exceeded — 88%", "Above 85% for 5 minutes. Threshold is 80%.", AlarmState.active, "cpu > 80% / 5m", 8),
    ("notify-gateway", "notify_fastapi", Severity.warning, "Memory threshold exceeded — 92%", "Limit 512MB, usage 470MB. OOM risk.", AlarmState.active, "mem > 90%", 8),
    ("analytics-pipeline", "analytics_postgres", Severity.warning, "High memory usage — 79%", "Limit 2048MB, usage 1620MB.", AlarmState.acknowledged, "mem > 75%", 21),
    ("orders-service", "orders_celery_worker", Severity.info, "Container restarted", "Single restart after a planned deploy. Healthy.", AlarmState.resolved, "deploy.restart", 60),
    ("payments-api", "payments_postgres", Severity.warning, "Connection pool at 85%", "max_connections 100, active 85.", AlarmState.resolved, "pg.connections > 80%", 120),
]

ALARM_RULES = [
    ("status", "==", "exited", Severity.critical, True),
    ("restarts", ">", "5 / 10m", Severity.critical, True),
    ("cpu", ">", "80% / 5m", Severity.warning, True),
    ("memory", ">", "90%", Severity.warning, True),
    ("healthcheck", "==", "fail", Severity.warning, True),
    ("disk", ">", "85%", Severity.warning, False),
]

REMEDIATION_RULES = [
    ("status == exited & OOMKilled", "Increase memory limit by 25% and recreate", "compose up -d --force-recreate", True),
    ("restarts > 5 / 10m", "Roll back to the last healthy image", "compose pull <prev> && up -d", True),
    ("cpu > 95% / 10m", "Scale replicas by one", "compose up -d --scale api=+1", False),
    ("healthcheck fail x3", "Restart the container", "docker restart <name>", True),
]


def _series(base: float, count: int) -> list[float]:
    value = base
    points = []
    for _ in range(count):
        value = max(0, value + (random.random() - 0.5) * (base * 0.2 + 1))
        points.append(round(value, 1))
    return points


async def seed() -> None:
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    async with session_factory() as db:
        if await db.scalar(select(func.count()).select_from(App)):
            print("Fleet already seeded — nothing to do.")
            return

        db.add(User(email=ADMIN_EMAIL, full_name="Sentinel Admin", password_hash=hash_password(ADMIN_PASSWORD), role=UserRole.admin))

        apps_by_name = {}
        containers_by_name = {}
        for spec in APPS:
            instance, zone, machine, ip, os_name = spec["vm"]
            app = App(
                name=spec["name"], env=spec["env"], description=spec["description"], health=spec["health"],
                compose_path=spec["compose_path"], gcp_project=spec["gcp_project"], auth_method=AuthMethod.sa,
                vm_instance=instance, vm_zone=zone, vm_machine=machine, vm_ip=ip, vm_os=os_name,
            )
            for row in spec["containers"]:
                name, svc, image, tag, status, health, cpu, mem, mem_limit, mem_pct, net, uptime, restarts, ports, exit_code, exit_reason = row
                app.containers.append(Container(
                    name=name, service_type=svc, image=image, tag=tag, status=status, health=health,
                    cpu=cpu, mem=mem, mem_limit=mem_limit, mem_pct=mem_pct, net=net, uptime=uptime,
                    restarts=restarts, ports=ports, exit_code=exit_code, exit_reason=exit_reason,
                ))
                containers_by_name[name] = None
            db.add(app)
            apps_by_name[spec["name"]] = app

        await db.flush()
        for app in apps_by_name.values():
            for container in app.containers:
                containers_by_name[container.name] = container

        now = datetime.now(UTC)
        for container in containers_by_name.values():
            if container.status == ContainerStatus.exited:
                continue
            cpu_pts = _series(container.cpu, 40)
            mem_pts = _series(container.mem_pct, 40)
            net_pts = _series(container.net, 40)
            for offset in range(40):
                db.add(MetricSample(
                    container_id=container.id, cpu=cpu_pts[offset], mem_pct=mem_pts[offset], net=net_pts[offset],
                    recorded_at=now - timedelta(seconds=(40 - offset) * 30),
                ))

        for app_name, container_name, severity, title, detail, state, rule, minutes in ALARMS:
            triggered_at = now - timedelta(minutes=minutes)
            container = containers_by_name.get(container_name)
            alarm = Alarm(
                app_id=apps_by_name[app_name].id, container_id=container.id if container else None,
                severity=severity, state=state, title=title, detail=detail, rule=rule, triggered_at=triggered_at,
            )
            alarm.events.append(TimelineEvent(kind="trigger", title="Alarm triggered", detail=f"Rule matched: {rule}", occurred_at=triggered_at))
            if state in (AlarmState.acknowledged, AlarmState.resolved):
                alarm.acknowledged_at = triggered_at + timedelta(minutes=2)
                alarm.events.append(TimelineEvent(kind="ack", title="Alarm acknowledged", occurred_at=alarm.acknowledged_at))
            if state == AlarmState.resolved:
                alarm.resolved_at = triggered_at + timedelta(minutes=10)
                alarm.events.append(TimelineEvent(kind="resolve", title="Incident resolved", occurred_at=alarm.resolved_at))
            db.add(alarm)

        for metric, operator, threshold, severity, enabled in ALARM_RULES:
            db.add(AlarmRule(metric=metric, operator=operator, threshold=threshold, severity=severity, enabled=enabled))
        for condition, action, command, enabled in REMEDIATION_RULES:
            db.add(RemediationRule(condition=condition, action=action, command=command, enabled=enabled))

        db.add(NotificationChannel(
            type=ChannelType.slack, enabled=True,
            config={"workspace": "acme-eng", "criticalChannel": "#alerts-prod", "warningChannel": "#alerts-warn", "tagHere": True},
        ))

        await db.commit()

    print(f"Seeded fleet. Admin login: {ADMIN_EMAIL} / {ADMIN_PASSWORD}")


if __name__ == "__main__":
    asyncio.run(seed())
