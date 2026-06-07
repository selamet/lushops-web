from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import ConflictError
from app.core.security import hash_password, verify_password
from app.modules.auth.models import User
from app.modules.auth.schemas import UserCreate


async def get_by_id(db: AsyncSession, user_id: str) -> User | None:
    return await db.get(User, user_id)


async def get_by_email(db: AsyncSession, email: str) -> User | None:
    result = await db.execute(select(User).where(User.email == email))
    return result.scalar_one_or_none()


async def create_user(db: AsyncSession, payload: UserCreate) -> User:
    if await get_by_email(db, payload.email):
        raise ConflictError("A user with this email already exists")
    user = User(
        email=payload.email,
        full_name=payload.full_name,
        password_hash=hash_password(payload.password),
        role=payload.role,
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)
    return user


async def authenticate(db: AsyncSession, email: str, password: str) -> User | None:
    user = await get_by_email(db, email)
    if not user or not user.is_active or not verify_password(password, user.password_hash):
        return None
    return user
