from datetime import datetime
from typing import Any

from app.core.schema import CamelModel
from app.modules.notifications.models import ChannelType


class ChannelCreate(CamelModel):
    type: ChannelType
    enabled: bool = False
    config: dict[str, Any] = {}


class ChannelUpdate(CamelModel):
    enabled: bool | None = None
    config: dict[str, Any] | None = None


class ChannelOut(CamelModel):
    id: str
    type: ChannelType
    enabled: bool
    config: dict[str, Any]
    created_at: datetime
    updated_at: datetime
