import enum
from datetime import datetime

from sqlalchemy import DateTime, Enum, Float, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base, IdMixin, TimestampMixin
from app.modules.apps.models import App


class ServiceType(str, enum.Enum):
    fastapi = "fastapi"
    django = "django"
    nginx = "nginx"
    postgres = "postgres"
    redis = "redis"
    celery = "celery"
    flower = "flower"
    rabbitmq = "rabbitmq"
    gunicorn = "gunicorn"


class ContainerStatus(str, enum.Enum):
    running = "running"
    restarting = "restarting"
    exited = "exited"
    paused = "paused"


class ContainerHealth(str, enum.Enum):
    healthy = "healthy"
    unhealthy = "unhealthy"


class ActionKind(str, enum.Enum):
    restart = "restart"
    stop = "stop"
    start = "start"


class ActionStatus(str, enum.Enum):
    pending = "pending"
    success = "success"
    failed = "failed"


class LogLevel(str, enum.Enum):
    info = "info"
    warn = "warn"
    error = "error"
    fatal = "fatal"


class Container(IdMixin, TimestampMixin, Base):
    __tablename__ = "containers"

    app_id: Mapped[str] = mapped_column("appId", ForeignKey("apps.id", ondelete="CASCADE"), index=True)
    name: Mapped[str] = mapped_column(String(120), index=True)
    service_type: Mapped[ServiceType] = mapped_column("serviceType", Enum(ServiceType))
    image: Mapped[str] = mapped_column(String(255))
    tag: Mapped[str] = mapped_column(String(80))
    status: Mapped[ContainerStatus] = mapped_column(Enum(ContainerStatus), default=ContainerStatus.running)
    health: Mapped[ContainerHealth] = mapped_column(Enum(ContainerHealth), default=ContainerHealth.healthy)

    cpu: Mapped[float] = mapped_column(Float, default=0)
    mem: Mapped[int] = mapped_column(Integer, default=0)
    mem_limit: Mapped[int] = mapped_column("memLimit", Integer, default=0)
    mem_pct: Mapped[float] = mapped_column("memPct", Float, default=0)
    net: Mapped[float] = mapped_column(Float, default=0)
    uptime: Mapped[str] = mapped_column(String(40), default="—")
    restarts: Mapped[int] = mapped_column(Integer, default=0)
    ports: Mapped[str] = mapped_column(String(120), default="—")
    exit_code: Mapped[int | None] = mapped_column("exitCode", Integer, default=None)
    exit_reason: Mapped[str | None] = mapped_column("exitReason", String(120), default=None)

    app: Mapped[App] = relationship(back_populates="containers")


class ContainerAction(IdMixin, TimestampMixin, Base):
    __tablename__ = "container_actions"

    container_id: Mapped[str] = mapped_column(
        "containerId", ForeignKey("containers.id", ondelete="CASCADE"), index=True
    )
    action: Mapped[ActionKind] = mapped_column(Enum(ActionKind))
    command: Mapped[str] = mapped_column(String(255))
    status: Mapped[ActionStatus] = mapped_column(Enum(ActionStatus), default=ActionStatus.pending)
    requested_by: Mapped[str | None] = mapped_column(
        "requestedBy", ForeignKey("users.id", ondelete="SET NULL"), default=None
    )


class LogEntry(IdMixin, Base):
    __tablename__ = "container_logs"

    container_id: Mapped[str] = mapped_column(
        "containerId", ForeignKey("containers.id", ondelete="CASCADE"), index=True
    )
    level: Mapped[LogLevel] = mapped_column(Enum(LogLevel), default=LogLevel.info)
    message: Mapped[str] = mapped_column(Text)
    recorded_at: Mapped[datetime] = mapped_column("recordedAt", DateTime(timezone=True), index=True)
