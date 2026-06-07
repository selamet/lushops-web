from typing import Annotated

from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_session
from app.modules.auth.dependencies import get_current_user, require_roles
from app.modules.auth.models import UserRole
from app.modules.rules import service
from app.modules.rules.schemas import (
    AlarmRuleCreate,
    AlarmRuleOut,
    AlarmRuleUpdate,
    RemediationRuleCreate,
    RemediationRuleOut,
    RemediationRuleUpdate,
)

router = APIRouter(prefix="/rules", tags=["rules"], dependencies=[Depends(get_current_user)])

DbSession = Annotated[AsyncSession, Depends(get_session)]
Writer = Depends(require_roles(UserRole.admin, UserRole.operator))


@router.get("/alarm", response_model=list[AlarmRuleOut])
async def list_alarm_rules(db: DbSession):
    return await service.list_alarm_rules(db)


@router.post("/alarm", response_model=AlarmRuleOut, status_code=status.HTTP_201_CREATED, dependencies=[Writer])
async def create_alarm_rule(payload: AlarmRuleCreate, db: DbSession):
    return await service.create_alarm_rule(db, payload)


@router.patch("/alarm/{rule_id}", response_model=AlarmRuleOut, dependencies=[Writer])
async def update_alarm_rule(rule_id: str, payload: AlarmRuleUpdate, db: DbSession):
    return await service.update_alarm_rule(db, rule_id, payload)


@router.delete("/alarm/{rule_id}", status_code=status.HTTP_204_NO_CONTENT, dependencies=[Writer])
async def delete_alarm_rule(rule_id: str, db: DbSession):
    await service.delete_alarm_rule(db, rule_id)


@router.get("/remediation", response_model=list[RemediationRuleOut])
async def list_remediation_rules(db: DbSession):
    return await service.list_remediation_rules(db)


@router.post(
    "/remediation", response_model=RemediationRuleOut, status_code=status.HTTP_201_CREATED, dependencies=[Writer]
)
async def create_remediation_rule(payload: RemediationRuleCreate, db: DbSession):
    return await service.create_remediation_rule(db, payload)


@router.patch("/remediation/{rule_id}", response_model=RemediationRuleOut, dependencies=[Writer])
async def update_remediation_rule(rule_id: str, payload: RemediationRuleUpdate, db: DbSession):
    return await service.update_remediation_rule(db, rule_id, payload)


@router.delete("/remediation/{rule_id}", status_code=status.HTTP_204_NO_CONTENT, dependencies=[Writer])
async def delete_remediation_rule(rule_id: str, db: DbSession):
    await service.delete_remediation_rule(db, rule_id)
