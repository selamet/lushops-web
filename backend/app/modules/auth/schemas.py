from datetime import datetime

from pydantic import EmailStr, Field

from app.core.schema import CamelModel
from app.modules.auth.models import UserRole


class UserCreate(CamelModel):
    email: EmailStr
    full_name: str = Field(min_length=1, max_length=120)
    password: str = Field(min_length=8, max_length=128)
    role: UserRole = UserRole.viewer


class UserOut(CamelModel):
    id: str
    email: EmailStr
    full_name: str
    role: UserRole
    is_active: bool
    created_at: datetime


class TokenOut(CamelModel):
    access_token: str
    token_type: str = "bearer"
