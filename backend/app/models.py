"""Single import surface for Alembic and metadata creation.

As each module is added, import its models here so they register on `Base.metadata`.
"""

from app.core.database import Base
from app.modules.apps.models import App
from app.modules.auth.models import User
from app.modules.containers.models import Container, ContainerAction, LogEntry
from app.modules.metrics.models import MetricSample

__all__ = ["Base", "User", "App", "Container", "ContainerAction", "LogEntry", "MetricSample"]
