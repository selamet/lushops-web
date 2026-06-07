"""Single import surface for Alembic and metadata creation.

As each module is added, import its models here so they register on `Base.metadata`.
"""

from app.core.database import Base

__all__ = ["Base"]
