from datetime import datetime

from pydantic import Field

from app.core.schema import CamelModel
from app.modules.containers.models import (
    ActionKind,
    ActionStatus,
    ContainerHealth,
    ContainerStatus,
    LogLevel,
    ServiceType,
)


class ContainerCreate(CamelModel):
    name: str = Field(min_length=1, max_length=120)
    service_type: ServiceType
    image: str = Field(min_length=1, max_length=255)
    tag: str = Field(min_length=1, max_length=80)
    status: ContainerStatus = ContainerStatus.running
    health: ContainerHealth = ContainerHealth.healthy
    cpu: float = 0
    mem: int = 0
    mem_limit: int = 0
    mem_pct: float = 0
    net: float = 0
    uptime: str = "—"
    restarts: int = 0
    ports: str = "—"
    exit_code: int | None = None
    exit_reason: str | None = None


class ContainerUpdate(CamelModel):
    status: ContainerStatus | None = None
    health: ContainerHealth | None = None
    cpu: float | None = None
    mem: int | None = None
    mem_limit: int | None = None
    mem_pct: float | None = None
    net: float | None = None
    uptime: str | None = None
    restarts: int | None = None
    ports: str | None = None
    exit_code: int | None = None
    exit_reason: str | None = None


class ContainerOut(CamelModel):
    id: str
    app_id: str
    name: str
    service_type: ServiceType
    image: str
    tag: str
    status: ContainerStatus
    health: ContainerHealth
    cpu: float
    mem: int
    mem_limit: int
    mem_pct: float
    net: float
    uptime: str
    restarts: int
    ports: str
    exit_code: int | None
    exit_reason: str | None
    created_at: datetime
    updated_at: datetime


class ActionRequest(CamelModel):
    action: ActionKind


class ActionOut(CamelModel):
    id: str
    container_id: str
    action: ActionKind
    command: str
    status: ActionStatus
    requested_by: str | None
    created_at: datetime


class LogIngest(CamelModel):
    level: LogLevel = LogLevel.info
    message: str = Field(min_length=1)
    recorded_at: datetime | None = None


class LogOut(CamelModel):
    level: LogLevel
    message: str
    recorded_at: datetime
