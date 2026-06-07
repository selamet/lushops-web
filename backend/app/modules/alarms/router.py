from typing import Annotated

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_session
from app.modules.alarms import service
from app.modules.alarms.models import AlarmState, Severity
from app.modules.alarms.schemas import AlarmCreate, AlarmDetailOut, AlarmOut, EventCreate
from app.modules.auth.dependencies import get_current_user, require_roles
from app.modules.auth.models import User, UserRole

router = APIRouter(prefix="/alarms", tags=["alarms"], dependencies=[Depends(get_current_user)])

DbSession = Annotated[AsyncSession, Depends(get_session)]
Writer = Depends(require_roles(UserRole.admin, UserRole.operator))
WriterUser = Annotated[User, Depends(require_roles(UserRole.admin, UserRole.operator))]


@router.get("", response_model=list[AlarmOut])
async def list_alarms(
    db: DbSession,
    state: AlarmState | None = None,
    severity: Severity | None = None,
    app_id: Annotated[str | None, Query(alias="appId")] = None,
):
    return await service.list_alarms(db, state, severity, app_id)


@router.post("", response_model=AlarmDetailOut, status_code=status.HTTP_201_CREATED, dependencies=[Writer])
async def create_alarm(payload: AlarmCreate, db: DbSession):
    return await service.create_alarm(db, payload)


@router.get("/{alarm_id}", response_model=AlarmDetailOut)
async def get_alarm(alarm_id: str, db: DbSession):
    return await service.get_alarm(db, alarm_id)


@router.post("/{alarm_id}/acknowledge", response_model=AlarmDetailOut)
async def acknowledge_alarm(alarm_id: str, db: DbSession, user: WriterUser):
    return await service.acknowledge(db, alarm_id, user.id)


@router.post("/{alarm_id}/resolve", response_model=AlarmDetailOut, dependencies=[Writer])
async def resolve_alarm(alarm_id: str, db: DbSession):
    return await service.resolve(db, alarm_id)


@router.post("/{alarm_id}/events", response_model=AlarmDetailOut, dependencies=[Writer])
async def add_event(alarm_id: str, payload: EventCreate, db: DbSession):
    return await service.add_event(db, alarm_id, payload)
