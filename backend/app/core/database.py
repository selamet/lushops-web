from collections.abc import AsyncGenerator
from datetime import datetime
from uuid import uuid4

from sqlalchemy import DateTime, String, event, func
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column

from app.core.config import settings

is_sqlite = settings.database_url.startswith("sqlite")
connect_args = {"check_same_thread": False} if is_sqlite else {}

engine = create_async_engine(settings.database_url, echo=settings.debug, connect_args=connect_args)
session_factory = async_sessionmaker(engine, expire_on_commit=False, class_=AsyncSession)

if is_sqlite:

    @event.listens_for(engine.sync_engine, "connect")
    def _enable_sqlite_fk(dbapi_connection, _):
        cursor = dbapi_connection.cursor()
        cursor.execute("PRAGMA foreign_keys=ON")
        cursor.close()


class Base(DeclarativeBase):
    pass


def new_id() -> str:
    return uuid4().hex


class IdMixin:
    id: Mapped[str] = mapped_column(String(32), primary_key=True, default=new_id)


class TimestampMixin:
    created_at: Mapped[datetime] = mapped_column("createdAt", DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        "updatedAt", DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )


async def get_session() -> AsyncGenerator[AsyncSession]:
    async with session_factory() as session:
        yield session
