from typing import Annotated

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_session
from app.modules.auth.dependencies import get_current_user, require_roles
from app.modules.auth.models import User, UserRole
from app.modules.containers import service
from app.modules.containers.schemas import (
    ActionOut,
    ActionRequest,
    ContainerCreate,
    ContainerOut,
    ContainerUpdate,
    LogIngest,
    LogOut,
)

router = APIRouter(tags=["containers"], dependencies=[Depends(get_current_user)])

DbSession = Annotated[AsyncSession, Depends(get_session)]
Writer = Depends(require_roles(UserRole.admin, UserRole.operator))
WriterUser = Annotated[User, Depends(require_roles(UserRole.admin, UserRole.operator))]


@router.get("/apps/{app_id}/containers", response_model=list[ContainerOut])
async def list_containers(app_id: str, db: DbSession):
    return await service.list_by_app(db, app_id)


@router.post(
    "/apps/{app_id}/containers",
    response_model=ContainerOut,
    status_code=status.HTTP_201_CREATED,
    dependencies=[Writer],
)
async def create_container(app_id: str, payload: ContainerCreate, db: DbSession):
    return await service.create_container(db, app_id, payload)


@router.get("/containers/{container_id}", response_model=ContainerOut)
async def get_container(container_id: str, db: DbSession):
    return await service.get_container(db, container_id)


@router.patch("/containers/{container_id}", response_model=ContainerOut, dependencies=[Writer])
async def update_container(container_id: str, payload: ContainerUpdate, db: DbSession):
    return await service.update_container(db, container_id, payload)


@router.delete(
    "/containers/{container_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    dependencies=[Depends(require_roles(UserRole.admin))],
)
async def delete_container(container_id: str, db: DbSession):
    await service.delete_container(db, container_id)


@router.post("/containers/{container_id}/actions", response_model=ActionOut, status_code=status.HTTP_201_CREATED)
async def run_action(container_id: str, payload: ActionRequest, db: DbSession, user: WriterUser):
    return await service.run_action(db, container_id, payload.action, user.id)


@router.get("/containers/{container_id}/actions", response_model=list[ActionOut])
async def list_actions(container_id: str, db: DbSession):
    return await service.list_actions(db, container_id)


@router.get("/containers/{container_id}/logs", response_model=list[LogOut])
async def list_logs(container_id: str, db: DbSession, limit: Annotated[int, Query(ge=1, le=500)] = 100):
    return await service.list_logs(db, container_id, limit)


@router.post(
    "/containers/{container_id}/logs",
    response_model=LogOut,
    status_code=status.HTTP_201_CREATED,
    dependencies=[Writer],
)
async def ingest_log(container_id: str, payload: LogIngest, db: DbSession):
    return await service.ingest_log(db, container_id, payload)
