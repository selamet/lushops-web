from typing import Annotated

from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_session
from app.modules.apps import service
from app.modules.apps.schemas import AppCreate, AppOut, AppUpdate
from app.modules.auth.dependencies import get_current_user, require_roles
from app.modules.auth.models import UserRole

router = APIRouter(prefix="/apps", tags=["apps"], dependencies=[Depends(get_current_user)])

DbSession = Annotated[AsyncSession, Depends(get_session)]
Writer = Depends(require_roles(UserRole.admin, UserRole.operator))


@router.get("", response_model=list[AppOut])
async def list_apps(db: DbSession):
    return await service.list_apps(db)


@router.post("", response_model=AppOut, status_code=status.HTTP_201_CREATED, dependencies=[Writer])
async def create_app(payload: AppCreate, db: DbSession):
    return await service.create_app(db, payload)


@router.get("/{app_id}", response_model=AppOut)
async def get_app(app_id: str, db: DbSession):
    return await service.get_app(db, app_id)


@router.patch("/{app_id}", response_model=AppOut, dependencies=[Writer])
async def update_app(app_id: str, payload: AppUpdate, db: DbSession):
    return await service.update_app(db, app_id, payload)


@router.delete(
    "/{app_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    dependencies=[Depends(require_roles(UserRole.admin))],
)
async def delete_app(app_id: str, db: DbSession):
    await service.delete_app(db, app_id)
