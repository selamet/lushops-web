from datetime import datetime

from app.core.schema import CamelModel


class MetricIngest(CamelModel):
    cpu: float
    mem_pct: float
    net: float
    recorded_at: datetime | None = None


class MetricOut(CamelModel):
    cpu: float
    mem_pct: float
    net: float
    recorded_at: datetime
