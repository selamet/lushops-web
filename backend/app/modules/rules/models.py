from datetime import datetime

from sqlalchemy import Boolean, DateTime, Enum, Integer, String
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base, IdMixin, TimestampMixin
from app.modules.alarms.models import Severity


class AlarmRule(IdMixin, TimestampMixin, Base):
    __tablename__ = "alarm_rules"

    metric: Mapped[str] = mapped_column(String(60))
    operator: Mapped[str] = mapped_column(String(10))
    threshold: Mapped[str] = mapped_column(String(60))
    severity: Mapped[Severity] = mapped_column(Enum(Severity), default=Severity.warning)
    enabled: Mapped[bool] = mapped_column(Boolean, default=True)


class RemediationRule(IdMixin, TimestampMixin, Base):
    __tablename__ = "remediation_rules"

    condition: Mapped[str] = mapped_column(String(120))
    action: Mapped[str] = mapped_column(String(200))
    command: Mapped[str] = mapped_column(String(255))
    enabled: Mapped[bool] = mapped_column(Boolean, default=True)
    run_count: Mapped[int] = mapped_column("runCount", Integer, default=0)
    last_run_at: Mapped[datetime | None] = mapped_column("lastRunAt", DateTime(timezone=True), default=None)
