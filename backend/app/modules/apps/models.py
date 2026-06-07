import enum
from typing import TYPE_CHECKING

from sqlalchemy import Enum, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base, IdMixin, TimestampMixin

if TYPE_CHECKING:
    from app.modules.containers.models import Container


class Environment(str, enum.Enum):
    prod = "prod"
    staging = "staging"
    dev = "dev"


class AppHealth(str, enum.Enum):
    ok = "ok"
    warn = "warn"
    crit = "crit"


class AuthMethod(str, enum.Enum):
    sa = "sa"
    ssh = "ssh"
    iap = "iap"


class App(IdMixin, TimestampMixin, Base):
    __tablename__ = "apps"

    name: Mapped[str] = mapped_column(String(80), unique=True, index=True)
    env: Mapped[Environment] = mapped_column(Enum(Environment), default=Environment.prod)
    description: Mapped[str] = mapped_column(Text, default="")
    health: Mapped[AppHealth] = mapped_column(Enum(AppHealth), default=AppHealth.ok)

    compose_path: Mapped[str] = mapped_column("composePath", String(255))
    gcp_project: Mapped[str] = mapped_column("gcpProject", String(120))
    auth_method: Mapped[AuthMethod] = mapped_column("authMethod", Enum(AuthMethod), default=AuthMethod.sa)
    collect_interval: Mapped[int] = mapped_column("collectInterval", Integer, default=30)
    credential_ref: Mapped[str | None] = mapped_column("credentialRef", String(255), default=None)

    vm_instance: Mapped[str] = mapped_column("vmInstance", String(120))
    vm_zone: Mapped[str] = mapped_column("vmZone", String(60))
    vm_machine: Mapped[str | None] = mapped_column("vmMachine", String(60), default=None)
    vm_ip: Mapped[str | None] = mapped_column("vmIp", String(45), default=None)
    vm_os: Mapped[str | None] = mapped_column("vmOs", String(80), default=None)

    containers: Mapped[list["Container"]] = relationship(
        back_populates="app", cascade="all, delete-orphan", passive_deletes=True
    )

    @property
    def vm(self) -> dict:
        return {
            "instance": self.vm_instance,
            "zone": self.vm_zone,
            "machine": self.vm_machine,
            "ip": self.vm_ip,
            "os": self.vm_os,
        }
