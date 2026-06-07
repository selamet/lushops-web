import enum

from sqlalchemy import Boolean, Enum, String
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base, IdMixin, TimestampMixin


class UserRole(str, enum.Enum):
    admin = "admin"
    operator = "operator"
    viewer = "viewer"


class User(IdMixin, TimestampMixin, Base):
    __tablename__ = "users"

    email: Mapped[str] = mapped_column(String(255), unique=True, index=True)
    password_hash: Mapped[str] = mapped_column("passwordHash", String(255))
    full_name: Mapped[str] = mapped_column("fullName", String(120))
    role: Mapped[UserRole] = mapped_column(Enum(UserRole), default=UserRole.viewer)
    is_active: Mapped[bool] = mapped_column("isActive", Boolean, default=True)
