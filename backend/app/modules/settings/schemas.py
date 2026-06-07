from pydantic import Field

from app.core.schema import CamelModel


class GeneralSettings(CamelModel):
    data_retention_days: int = Field(default=30, ge=1, le=365)
    default_interval: int = Field(default=30, ge=5, le=3600)
    quiet_hours_enabled: bool = True
    quiet_hours_start: str = "22:00"
    quiet_hours_end: str = "07:00"
    auto_remediation_enabled: bool = False


class GeneralSettingsUpdate(CamelModel):
    data_retention_days: int | None = Field(default=None, ge=1, le=365)
    default_interval: int | None = Field(default=None, ge=5, le=3600)
    quiet_hours_enabled: bool | None = None
    quiet_hours_start: str | None = None
    quiet_hours_end: str | None = None
    auto_remediation_enabled: bool | None = None
