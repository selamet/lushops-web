from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import NotFoundError
from app.modules.notifications.models import NotificationChannel
from app.modules.notifications.schemas import ChannelCreate, ChannelUpdate


async def list_channels(db: AsyncSession) -> list[NotificationChannel]:
    result = await db.execute(select(NotificationChannel).order_by(NotificationChannel.type))
    return list(result.scalars().all())


async def get_channel(db: AsyncSession, channel_id: str) -> NotificationChannel:
    channel = await db.get(NotificationChannel, channel_id)
    if not channel:
        raise NotFoundError("Notification channel not found")
    return channel


async def create_channel(db: AsyncSession, payload: ChannelCreate) -> NotificationChannel:
    channel = NotificationChannel(type=payload.type, enabled=payload.enabled, config=payload.config)
    db.add(channel)
    await db.commit()
    await db.refresh(channel)
    return channel


async def update_channel(db: AsyncSession, channel_id: str, payload: ChannelUpdate) -> NotificationChannel:
    channel = await get_channel(db, channel_id)
    data = payload.model_dump(exclude_unset=True)
    if "enabled" in data:
        channel.enabled = data["enabled"]
    if "config" in data:
        channel.config = data["config"]
    await db.commit()
    await db.refresh(channel)
    return channel


async def delete_channel(db: AsyncSession, channel_id: str) -> None:
    channel = await get_channel(db, channel_id)
    await db.delete(channel)
    await db.commit()
