from typing import Annotated

from fastapi import Depends
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_session
from app.core.exceptions import AuthError, ForbiddenError
from app.core.security import decode_access_token
from app.modules.auth import service
from app.modules.auth.models import User, UserRole

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/login")


async def get_current_user(
    token: Annotated[str, Depends(oauth2_scheme)],
    db: Annotated[AsyncSession, Depends(get_session)],
) -> User:
    try:
        payload = decode_access_token(token)
    except Exception as exc:
        raise AuthError("Invalid or expired token") from exc
    user = await service.get_by_id(db, payload.get("sub", ""))
    if not user or not user.is_active:
        raise AuthError("User no longer active")
    return user


CurrentUser = Annotated[User, Depends(get_current_user)]


def require_roles(*roles: UserRole):
    async def checker(user: CurrentUser) -> User:
        if user.role not in roles:
            raise ForbiddenError("Insufficient permissions for this action")
        return user

    return checker
