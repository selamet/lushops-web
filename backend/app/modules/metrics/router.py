from typing import Annotated

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_session
from app.modules.auth.dependencies import get_current_user, require_roles
from app.modules.auth.models import UserRole
from app.modules.metrics import service
from app.modules.metrics.schemas import MetricIngest, MetricOut

router = APIRouter(tags=["metrics"], dependencies=[Depends(get_current_user)])

DbSession = Annotated[AsyncSession, Depends(get_session)]
Writer = Depends(require_roles(UserRole.admin, UserRole.operator))


@router.get("/containers/{container_id}/metrics", response_model=list[MetricOut])
async def list_metrics(container_id: str, db: DbSession, limit: Annotated[int, Query(ge=1, le=500)] = 40):
    return await service.list_samples(db, container_id, limit)


@router.post(
    "/containers/{container_id}/metrics",
    response_model=MetricOut,
    status_code=status.HTTP_201_CREATED,
    dependencies=[Writer],
)
async def ingest_metric(container_id: str, payload: MetricIngest, db: DbSession):
    return await service.ingest_sample(db, container_id, payload)
