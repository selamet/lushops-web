from datetime import datetime

from pydantic import Field

from app.core.schema import CamelModel
from app.modules.alarms.models import Severity


class AlarmRuleCreate(CamelModel):
    metric: str = Field(min_length=1, max_length=60)
    operator: str = Field(min_length=1, max_length=10)
    threshold: str = Field(min_length=1, max_length=60)
    severity: Severity = Severity.warning
    enabled: bool = True


class AlarmRuleUpdate(CamelModel):
    metric: str | None = Field(default=None, max_length=60)
    operator: str | None = Field(default=None, max_length=10)
    threshold: str | None = Field(default=None, max_length=60)
    severity: Severity | None = None
    enabled: bool | None = None


class AlarmRuleOut(CamelModel):
    id: str
    metric: str
    operator: str
    threshold: str
    severity: Severity
    enabled: bool


class RemediationRuleCreate(CamelModel):
    condition: str = Field(min_length=1, max_length=120)
    action: str = Field(min_length=1, max_length=200)
    command: str = Field(min_length=1, max_length=255)
    enabled: bool = True


class RemediationRuleUpdate(CamelModel):
    condition: str | None = Field(default=None, max_length=120)
    action: str | None = Field(default=None, max_length=200)
    command: str | None = Field(default=None, max_length=255)
    enabled: bool | None = None


class RemediationRuleOut(CamelModel):
    id: str
    condition: str
    action: str
    command: str
    enabled: bool
    run_count: int
    last_run_at: datetime | None
