from datetime import datetime

from pydantic import Field

from app.core.schema import CamelModel
from app.modules.apps.models import AppHealth, AuthMethod, Environment


class VmInfo(CamelModel):
    instance: str = Field(min_length=1, max_length=120)
    zone: str = Field(min_length=1, max_length=60)
    machine: str | None = None
    ip: str | None = None
    os: str | None = None


class AppCreate(CamelModel):
    name: str = Field(min_length=1, max_length=80)
    description: str = Field(default="", max_length=200)
    env: Environment = Environment.prod
    vm: VmInfo
    gcp_project: str = Field(min_length=1, max_length=120)
    auth_method: AuthMethod = AuthMethod.sa
    compose_path: str = Field(min_length=1, max_length=255)
    collect_interval: int = Field(default=30, ge=5, le=3600)
    credential_ref: str | None = Field(default=None, max_length=255)


class AppUpdate(CamelModel):
    description: str | None = Field(default=None, max_length=200)
    env: Environment | None = None
    health: AppHealth | None = None
    vm: VmInfo | None = None
    gcp_project: str | None = Field(default=None, max_length=120)
    auth_method: AuthMethod | None = None
    compose_path: str | None = Field(default=None, max_length=255)
    collect_interval: int | None = Field(default=None, ge=5, le=3600)


class AppOut(CamelModel):
    id: str
    name: str
    env: Environment
    description: str
    health: AppHealth
    vm: VmInfo
    gcp_project: str
    auth_method: AuthMethod
    compose_path: str
    collect_interval: int
    created_at: datetime
    updated_at: datetime
