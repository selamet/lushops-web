import enum

from sqlalchemy import JSON, Boolean, Enum
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base, IdMixin, TimestampMixin


class ChannelType(str, enum.Enum):
    slack = "slack"
    email = "email"
    telegram = "telegram"
    webhook = "webhook"
    pagerduty = "pagerduty"


class NotificationChannel(IdMixin, TimestampMixin, Base):
    __tablename__ = "notification_channels"

    type: Mapped[ChannelType] = mapped_column(Enum(ChannelType))
    enabled: Mapped[bool] = mapped_column(Boolean, default=False)
    config: Mapped[dict] = mapped_column(JSON, default=dict)
