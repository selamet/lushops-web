from datetime import UTC, datetime

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.exceptions import ConflictError, NotFoundError
from app.modules.alarms.models import Alarm, AlarmState, Severity, TimelineEvent
from app.modules.alarms.schemas import AlarmCreate, EventCreate
from app.modules.apps.service import get_app


def _now() -> datetime:
    return datetime.now(UTC)


async def create_alarm(db: AsyncSession, payload: AlarmCreate) -> Alarm:
    await get_app(db, payload.app_id)
    triggered_at = payload.triggered_at or _now()
    alarm = Alarm(
        app_id=payload.app_id,
        container_id=payload.container_id,
        severity=payload.severity,
        title=payload.title,
        detail=payload.detail,
        rule=payload.rule,
        triggered_at=triggered_at,
    )
    alarm.events.append(
        TimelineEvent(
            kind="trigger",
            title="Alarm triggered",
            detail=f"Rule matched: {payload.rule}",
            occurred_at=triggered_at,
        )
    )
    db.add(alarm)
    await db.commit()
    return await get_alarm(db, alarm.id)


async def list_alarms(
    db: AsyncSession,
    state: AlarmState | None,
    severity: Severity | None,
    app_id: str | None,
) -> list[Alarm]:
    query = select(Alarm).order_by(Alarm.triggered_at.desc())
    if state:
        query = query.where(Alarm.state == state)
    if severity:
        query = query.where(Alarm.severity == severity)
    if app_id:
        query = query.where(Alarm.app_id == app_id)
    result = await db.execute(query)
    return list(result.scalars().all())


async def get_alarm(db: AsyncSession, alarm_id: str) -> Alarm:
    result = await db.execute(
        select(Alarm).where(Alarm.id == alarm_id).options(selectinload(Alarm.events))
    )
    alarm = result.scalar_one_or_none()
    if not alarm:
        raise NotFoundError("Alarm not found")
    return alarm


async def add_event(db: AsyncSession, alarm_id: str, payload: EventCreate) -> Alarm:
    alarm = await get_alarm(db, alarm_id)
    alarm.events.append(
        TimelineEvent(
            kind=payload.kind,
            title=payload.title,
            detail=payload.detail,
            occurred_at=payload.occurred_at or _now(),
        )
    )
    await db.commit()
    return await get_alarm(db, alarm_id)


async def acknowledge(db: AsyncSession, alarm_id: str, user_id: str) -> Alarm:
    alarm = await get_alarm(db, alarm_id)
    if alarm.state != AlarmState.active:
        raise ConflictError("Only active alarms can be acknowledged")
    now = _now()
    alarm.state = AlarmState.acknowledged
    alarm.acknowledged_at = now
    alarm.acknowledged_by = user_id
    alarm.events.append(TimelineEvent(kind="ack", title="Alarm acknowledged", occurred_at=now))
    await db.commit()
    return await get_alarm(db, alarm_id)


async def resolve(db: AsyncSession, alarm_id: str) -> Alarm:
    alarm = await get_alarm(db, alarm_id)
    if alarm.state == AlarmState.resolved:
        raise ConflictError("Alarm is already resolved")
    now = _now()
    alarm.state = AlarmState.resolved
    alarm.resolved_at = now
    alarm.events.append(TimelineEvent(kind="resolve", title="Incident resolved", occurred_at=now))
    await db.commit()
    return await get_alarm(db, alarm_id)
