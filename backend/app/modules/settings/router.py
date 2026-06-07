from typing import Annotated

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_session
from app.modules.auth.dependencies import get_current_user, require_roles
from app.modules.auth.models import UserRole
from app.modules.settings import service
from app.modules.settings.schemas import GeneralSettings, GeneralSettingsUpdate

router = APIRouter(prefix="/settings", tags=["settings"], dependencies=[Depends(get_current_user)])

DbSession = Annotated[AsyncSession, Depends(get_session)]
Writer = Depends(require_roles(UserRole.admin, UserRole.operator))


@router.get("", response_model=GeneralSettings)
async def get_settings(db: DbSession):
    return await service.get_general(db)


@router.put("", response_model=GeneralSettings, dependencies=[Writer])
async def update_settings(payload: GeneralSettingsUpdate, db: DbSession):
    return await service.update_general(db, payload)
