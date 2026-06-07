from datetime import datetime

from sqlalchemy import DateTime, Float, ForeignKey, Index, String
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base, new_id


class MetricSample(Base):
    __tablename__ = "metric_samples"
    __table_args__ = (Index("ix_metric_container_time", "containerId", "recordedAt"),)

    id: Mapped[str] = mapped_column(String(32), primary_key=True, default=new_id)
    container_id: Mapped[str] = mapped_column(
        "containerId", ForeignKey("containers.id", ondelete="CASCADE")
    )
    cpu: Mapped[float] = mapped_column(Float)
    mem_pct: Mapped[float] = mapped_column("memPct", Float)
    net: Mapped[float] = mapped_column(Float)
    recorded_at: Mapped[datetime] = mapped_column("recordedAt", DateTime(timezone=True))
