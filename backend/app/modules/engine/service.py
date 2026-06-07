"""Rule engine: evaluate alarm rules against the fleet, fire/resolve alarms and
record auto-remediation attempts. Pure logic over the existing models so it can
run from the manual endpoint or the background scheduler."""

import re
from datetime import UTC, datetime

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.modules.alarms.models import Alarm, AlarmState, Severity, TimelineEvent
from app.modules.apps.models import App, AppHealth
from app.modules.containers.models import Container, ContainerHealth, ContainerStatus
from app.modules.rules.models import AlarmRule, RemediationRule

_NUMERIC = {"cpu", "restarts", "memory"}
_KEYWORDS = ("status", "restarts", "cpu", "memory", "healthcheck", "disk")


def _normalize_metric(metric: str) -> str:
    metric = metric.lower()
    return "memory" if "mem" in metric else metric


def rule_keyword(text: str) -> str:
    """Collapse a rule/metric string to a metric family so manual and engine alarms dedupe."""
    lowered = text.lower()
    if "mem" in lowered:
        return "memory"
    for keyword in _KEYWORDS:
        if keyword in lowered:
            return keyword
    return lowered.strip()


def _first_number(text: str) -> float | None:
    match = re.search(r"[\d.]+", text)
    return float(match.group()) if match else None


def _compare_num(value: float, operator: str, threshold: float) -> bool:
    return {
        ">": value > threshold,
        ">=": value >= threshold,
        "<": value < threshold,
        "<=": value <= threshold,
        "==": value == threshold,
        "!=": value != threshold,
    }.get(operator, False)


def _metric_value(metric: str, container: Container) -> float | None:
    if metric == "cpu":
        return container.cpu
    if metric == "restarts":
        return container.restarts
    if metric == "memory":
        return container.mem_pct
    return None


def matches(rule: AlarmRule, container: Container) -> bool:
    metric = _normalize_metric(rule.metric)
    if metric == "status":
        target = rule.threshold.split()[0].strip() if rule.threshold else ""
        equal = container.status.value == target
        return equal if rule.operator != "!=" else not equal
    if metric == "healthcheck":
        wants_fail = "fail" in rule.threshold.lower() or "unhealthy" in rule.threshold.lower()
        is_unhealthy = container.health == ContainerHealth.unhealthy
        return is_unhealthy != wants_fail if rule.operator == "!=" else is_unhealthy == wants_fail
    if metric not in _NUMERIC:
        return False
    value = _metric_value(metric, container)
    threshold = _first_number(rule.threshold)
    if value is None or threshold is None:
        return False
    return _compare_num(value, rule.operator, threshold)


def _signature(rule: AlarmRule) -> str:
    return f"{rule.metric} {rule.operator} {rule.threshold}"


def _title(rule: AlarmRule, container: Container) -> str:
    metric = _normalize_metric(rule.metric)
    if metric == "status":
        return f"Container {container.status.value}"
    if metric == "restarts":
        return f"Restart loop detected — {container.restarts} restarts"
    if metric == "cpu":
        return f"CPU threshold exceeded — {container.cpu}%"
    if metric == "memory":
        return f"Memory threshold exceeded — {container.mem_pct}%"
    if metric == "healthcheck":
        return "Health check failing"
    return f"{rule.metric} alarm"


def _find_remediation(rules: list[RemediationRule], keyword: str) -> RemediationRule | None:
    token = "mem" if keyword == "memory" else keyword
    return next((r for r in rules if token in r.condition.lower()), None)


def _recompute_health(
    app: App, containers: list[Container], crit_apps: set[str], warn_apps: set[str]
) -> None:
    owned = [c for c in containers if c.app_id == app.id]
    if app.id in crit_apps or any(c.status == ContainerStatus.exited for c in owned):
        app.health = AppHealth.crit
    elif (
        app.id in warn_apps
        or any(c.status == ContainerStatus.restarting or c.health == ContainerHealth.unhealthy for c in owned)
    ):
        app.health = AppHealth.warn
    else:
        app.health = AppHealth.ok


async def run_cycle(db: AsyncSession) -> dict:
    """One evaluation pass. Returns counts of created/resolved/remediated alarms."""
    rules = list((await db.execute(select(AlarmRule).where(AlarmRule.enabled.is_(True)))).scalars())
    remediations = list(
        (await db.execute(select(RemediationRule).where(RemediationRule.enabled.is_(True)))).scalars()
    )
    apps = list((await db.execute(select(App))).scalars())
    containers = list((await db.execute(select(Container))).scalars())
    open_alarms = list(
        (
            await db.execute(
                select(Alarm)
                .where(Alarm.state.in_([AlarmState.active, AlarmState.acknowledged]))
                .options(selectinload(Alarm.events))
            )
        ).scalars()
    )

    active_by_key: dict[tuple[str, str], Alarm] = {}
    for alarm in open_alarms:
        if alarm.container_id:
            active_by_key[(alarm.container_id, rule_keyword(alarm.rule))] = alarm

    now = datetime.now(UTC)
    created = resolved = remediated = 0

    for container in containers:
        for rule in rules:
            key = (container.id, rule_keyword(rule.metric))
            fired = matches(rule, container)
            existing = active_by_key.get(key)

            if fired and existing is None:
                alarm = Alarm(
                    app_id=container.app_id,
                    container_id=container.id,
                    severity=rule.severity,
                    state=AlarmState.active,
                    title=_title(rule, container),
                    detail=f"Rule '{_signature(rule)}' matched on {container.name}.",
                    rule=_signature(rule),
                    triggered_at=now,
                    auto=True,
                )
                alarm.events.append(
                    TimelineEvent(kind="trigger", title="Alarm triggered", detail=_signature(rule), occurred_at=now)
                )
                remediation = _find_remediation(remediations, key[1])
                if remediation:
                    remediation.run_count += 1
                    remediation.last_run_at = now
                    alarm.events.append(
                        TimelineEvent(
                            kind="remediation",
                            title=f"Auto-remediation: {remediation.action}",
                            detail=remediation.command,
                            occurred_at=now,
                        )
                    )
                    remediated += 1
                db.add(alarm)
                active_by_key[key] = alarm
                created += 1
            elif not fired and existing is not None and existing.auto and existing.state == AlarmState.active:
                existing.state = AlarmState.resolved
                existing.resolved_at = now
                existing.events.append(
                    TimelineEvent(kind="resolve", title="Auto-resolved", detail="Condition cleared", occurred_at=now)
                )
                resolved += 1

    await db.flush()
    severities = (
        await db.execute(select(Alarm.app_id, Alarm.severity).where(Alarm.state == AlarmState.active))
    ).all()
    crit_apps = {app_id for app_id, sev in severities if sev == Severity.critical}
    warn_apps = {app_id for app_id, sev in severities if sev == Severity.warning}
    for app in apps:
        _recompute_health(app, containers, crit_apps, warn_apps)

    await db.commit()
    return {"created": created, "resolved": resolved, "remediated": remediated}
