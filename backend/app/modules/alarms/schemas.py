from datetime import datetime

from pydantic import Field

from app.core.schema import CamelModel
from app.modules.alarms.models import AlarmState, Severity


class AlarmCreate(CamelModel):
    app_id: str
    container_id: str | None = None
    severity: Severity
    title: str = Field(min_length=1, max_length=200)
    detail: str = Field(default="", max_length=2000)
    rule: str = Field(min_length=1, max_length=120)
    triggered_at: datetime | None = None


class EventCreate(CamelModel):
    kind: str = Field(min_length=1, max_length=40)
    title: str = Field(min_length=1, max_length=200)
    detail: str = Field(default="", max_length=2000)
    occurred_at: datetime | None = None


class TimelineEventOut(CamelModel):
    kind: str
    title: str
    detail: str
    occurred_at: datetime


class AlarmOut(CamelModel):
    id: str
    app_id: str
    container_id: str | None
    severity: Severity
    state: AlarmState
    title: str
    detail: str
    rule: str
    auto: bool
    triggered_at: datetime
    acknowledged_at: datetime | None
    resolved_at: datetime | None
    acknowledged_by: str | None
    created_at: datetime


class AlarmDetailOut(AlarmOut):
    events: list[TimelineEventOut]
