from typing import Annotated

from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_session
from app.modules.auth.dependencies import get_current_user, require_roles
from app.modules.auth.models import UserRole
from app.modules.notifications import service
from app.modules.notifications.schemas import ChannelCreate, ChannelOut, ChannelUpdate

router = APIRouter(prefix="/notifications/channels", tags=["notifications"], dependencies=[Depends(get_current_user)])

DbSession = Annotated[AsyncSession, Depends(get_session)]
Writer = Depends(require_roles(UserRole.admin, UserRole.operator))


@router.get("", response_model=list[ChannelOut])
async def list_channels(db: DbSession):
    return await service.list_channels(db)


@router.post("", response_model=ChannelOut, status_code=status.HTTP_201_CREATED, dependencies=[Writer])
async def create_channel(payload: ChannelCreate, db: DbSession):
    return await service.create_channel(db, payload)


@router.patch("/{channel_id}", response_model=ChannelOut, dependencies=[Writer])
async def update_channel(channel_id: str, payload: ChannelUpdate, db: DbSession):
    return await service.update_channel(db, channel_id, payload)


@router.delete("/{channel_id}", status_code=status.HTTP_204_NO_CONTENT, dependencies=[Writer])
async def delete_channel(channel_id: str, db: DbSession):
    await service.delete_channel(db, channel_id)
