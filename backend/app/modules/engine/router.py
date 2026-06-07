from typing import Annotated

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_session
from app.core.schema import CamelModel
from app.modules.auth.dependencies import require_roles
from app.modules.auth.models import UserRole
from app.modules.engine import service

router = APIRouter(prefix="/engine", tags=["engine"])

DbSession = Annotated[AsyncSession, Depends(get_session)]


class CycleResult(CamelModel):
    created: int
    resolved: int
    remediated: int


@router.post(
    "/evaluate",
    response_model=CycleResult,
    dependencies=[Depends(require_roles(UserRole.admin, UserRole.operator))],
)
async def evaluate(db: DbSession):
    return await service.run_cycle(db)
