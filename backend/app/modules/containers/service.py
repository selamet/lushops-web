from datetime import datetime, timezone

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import NotFoundError
from app.modules.apps.service import get_app
from app.modules.containers.models import ActionKind, Container, ContainerAction, LogEntry
from app.modules.containers.schemas import ContainerCreate, ContainerUpdate, LogIngest


async def list_by_app(db: AsyncSession, app_id: str) -> list[Container]:
    await get_app(db, app_id)
    result = await db.execute(select(Container).where(Container.app_id == app_id).order_by(Container.name))
    return list(result.scalars().all())


async def get_container(db: AsyncSession, container_id: str) -> Container:
    container = await db.get(Container, container_id)
    if not container:
        raise NotFoundError("Container not found")
    return container


async def create_container(db: AsyncSession, app_id: str, payload: ContainerCreate) -> Container:
    await get_app(db, app_id)
    container = Container(app_id=app_id, **payload.model_dump())
    db.add(container)
    await db.commit()
    await db.refresh(container)
    return container


async def update_container(db: AsyncSession, container_id: str, payload: ContainerUpdate) -> Container:
    container = await get_container(db, container_id)
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(container, field, value)
    await db.commit()
    await db.refresh(container)
    return container


async def delete_container(db: AsyncSession, container_id: str) -> None:
    container = await get_container(db, container_id)
    await db.delete(container)
    await db.commit()


async def run_action(db: AsyncSession, container_id: str, action: ActionKind, user_id: str) -> ContainerAction:
    container = await get_container(db, container_id)
    record = ContainerAction(
        container_id=container.id,
        action=action,
        command=f"docker {action.value} {container.name}",
        requested_by=user_id,
    )
    db.add(record)
    await db.commit()
    await db.refresh(record)
    return record


async def list_actions(db: AsyncSession, container_id: str) -> list[ContainerAction]:
    await get_container(db, container_id)
    result = await db.execute(
        select(ContainerAction)
        .where(ContainerAction.container_id == container_id)
        .order_by(ContainerAction.created_at.desc())
    )
    return list(result.scalars().all())


async def ingest_log(db: AsyncSession, container_id: str, payload: LogIngest) -> LogEntry:
    await get_container(db, container_id)
    entry = LogEntry(
        container_id=container_id,
        level=payload.level,
        message=payload.message,
        recorded_at=payload.recorded_at or datetime.now(timezone.utc),
    )
    db.add(entry)
    await db.commit()
    await db.refresh(entry)
    return entry


async def list_logs(db: AsyncSession, container_id: str, limit: int) -> list[LogEntry]:
    await get_container(db, container_id)
    result = await db.execute(
        select(LogEntry)
        .where(LogEntry.container_id == container_id)
        .order_by(LogEntry.recorded_at.desc())
        .limit(limit)
    )
    return list(reversed(result.scalars().all()))
