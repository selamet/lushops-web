import enum
from datetime import datetime

from sqlalchemy import Boolean, DateTime, Enum, ForeignKey, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base, IdMixin, TimestampMixin


class Severity(enum.StrEnum):
    critical = "critical"
    warning = "warning"
    info = "info"


class AlarmState(enum.StrEnum):
    active = "active"
    acknowledged = "acknowledged"
    resolved = "resolved"


class Alarm(IdMixin, TimestampMixin, Base):
    __tablename__ = "alarms"

    app_id: Mapped[str] = mapped_column("appId", ForeignKey("apps.id", ondelete="CASCADE"), index=True)
    container_id: Mapped[str | None] = mapped_column(
        "containerId", ForeignKey("containers.id", ondelete="SET NULL"), default=None
    )
    severity: Mapped[Severity] = mapped_column(Enum(Severity), index=True)
    state: Mapped[AlarmState] = mapped_column(Enum(AlarmState), default=AlarmState.active, index=True)
    title: Mapped[str] = mapped_column(String(200))
    detail: Mapped[str] = mapped_column(Text, default="")
    rule: Mapped[str] = mapped_column(String(120))
    auto: Mapped[bool] = mapped_column(Boolean, default=False)

    triggered_at: Mapped[datetime] = mapped_column("triggeredAt", DateTime(timezone=True))
    acknowledged_at: Mapped[datetime | None] = mapped_column("acknowledgedAt", DateTime(timezone=True), default=None)
    resolved_at: Mapped[datetime | None] = mapped_column("resolvedAt", DateTime(timezone=True), default=None)
    acknowledged_by: Mapped[str | None] = mapped_column(
        "acknowledgedBy", ForeignKey("users.id", ondelete="SET NULL"), default=None
    )

    events: Mapped[list["TimelineEvent"]] = relationship(
        back_populates="alarm",
        cascade="all, delete-orphan",
        order_by="TimelineEvent.occurred_at",
    )


class TimelineEvent(IdMixin, Base):
    __tablename__ = "alarm_events"

    alarm_id: Mapped[str] = mapped_column("alarmId", ForeignKey("alarms.id", ondelete="CASCADE"), index=True)
    kind: Mapped[str] = mapped_column(String(40))
    title: Mapped[str] = mapped_column(String(200))
    detail: Mapped[str] = mapped_column(Text, default="")
    occurred_at: Mapped[datetime] = mapped_column("occurredAt", DateTime(timezone=True))

    alarm: Mapped[Alarm] = relationship(back_populates="events")
