from datetime import datetime, timezone

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.containers.service import get_container
from app.modules.metrics.models import MetricSample
from app.modules.metrics.schemas import MetricIngest


async def ingest_sample(db: AsyncSession, container_id: str, payload: MetricIngest) -> MetricSample:
    await get_container(db, container_id)
    sample = MetricSample(
        container_id=container_id,
        cpu=payload.cpu,
        mem_pct=payload.mem_pct,
        net=payload.net,
        recorded_at=payload.recorded_at or datetime.now(timezone.utc),
    )
    db.add(sample)
    await db.commit()
    await db.refresh(sample)
    return sample


async def list_samples(db: AsyncSession, container_id: str, limit: int) -> list[MetricSample]:
    await get_container(db, container_id)
    result = await db.execute(
        select(MetricSample)
        .where(MetricSample.container_id == container_id)
        .order_by(MetricSample.recorded_at.desc())
        .limit(limit)
    )
    return list(reversed(result.scalars().all()))
