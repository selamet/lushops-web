"""Simulated collector + executor. Stands in for a real on-VM agent: it walks
container metrics over time and applies pending lifecycle actions, so the whole
alarm/remediation loop is visible without a live fleet."""

import random
from datetime import UTC, datetime

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.containers.models import (
    OPERATOR_STOP_REASON,
    ActionKind,
    ActionStatus,
    Container,
    ContainerAction,
    ContainerHealth,
    ContainerStatus,
)
from app.modules.metrics.models import MetricSample

_LIVE = (ContainerStatus.running, ContainerStatus.restarting)


def _clamp(value: float, lo: float, hi: float) -> float:
    return max(lo, min(hi, value))


def _walk(base: float, amplitude: float, lo: float, hi: float) -> float:
    return round(_clamp(base + (random.random() - 0.5) * amplitude, lo, hi), 1)


def _reset_healthy(container: Container) -> None:
    container.status = ContainerStatus.running
    container.health = ContainerHealth.healthy
    container.restarts = 0
    container.cpu = 8.0
    container.mem_pct = 20.0
    container.mem = round(container.mem_limit * 0.2)
    container.net = 1.0
    container.uptime = "0d 0h"
    container.exit_code = None
    container.exit_reason = None


def _apply(action: ActionKind, container: Container) -> None:
    if action == ActionKind.stop:
        container.status = ContainerStatus.exited
        container.cpu = container.net = 0
        container.mem = container.mem_pct = 0
        container.exit_code = 0
        container.exit_reason = OPERATOR_STOP_REASON
        container.uptime = "—"
    else:  # restart and start both bring the container back up
        _reset_healthy(container)


async def collect(db: AsyncSession) -> int:
    """Advance live container metrics by one step and store a sample each."""
    containers = list((await db.execute(select(Container).where(Container.status.in_(_LIVE)))).scalars())
    now = datetime.now(UTC)
    for c in containers:
        c.cpu = _walk(c.cpu, c.cpu * 0.15 + 2, 0, 100)
        c.mem_pct = _walk(c.mem_pct, 3, 0, 100)
        c.net = _walk(c.net, c.net * 0.25 + 0.5, 0, 999)
        c.mem = round(c.mem_limit * c.mem_pct / 100)
        db.add(MetricSample(container_id=c.id, cpu=c.cpu, mem_pct=c.mem_pct, net=c.net, recorded_at=now))
    return len(containers)


async def process_actions(db: AsyncSession) -> int:
    """Apply every pending lifecycle action to its container and mark it done."""
    pending = list(
        (await db.execute(select(ContainerAction).where(ContainerAction.status == ActionStatus.pending))).scalars()
    )
    for action in pending:
        container = await db.get(Container, action.container_id)
        if container:
            _apply(action.action, container)
        action.status = ActionStatus.success
    return len(pending)


async def tick(db: AsyncSession) -> dict:
    actions = await process_actions(db)
    collected = await collect(db)
    await db.commit()
    return {"collected": collected, "actions": actions}
