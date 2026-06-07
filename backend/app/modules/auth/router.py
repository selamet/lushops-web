from typing import Annotated

from fastapi import APIRouter, Depends, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_session
from app.core.exceptions import AuthError
from app.core.security import create_access_token
from app.modules.auth import service
from app.modules.auth.dependencies import CurrentUser
from app.modules.auth.schemas import TokenOut, UserCreate, UserOut

router = APIRouter(prefix="/auth", tags=["auth"])

DbSession = Annotated[AsyncSession, Depends(get_session)]


@router.post("/register", response_model=UserOut, status_code=status.HTTP_201_CREATED)
async def register(payload: UserCreate, db: DbSession):
    return await service.create_user(db, payload)


@router.post("/login", response_model=TokenOut)
async def login(form: Annotated[OAuth2PasswordRequestForm, Depends()], db: DbSession):
    user = await service.authenticate(db, form.username, form.password)
    if not user:
        raise AuthError("Incorrect email or password")
    return TokenOut(access_token=create_access_token(user.id, user.role.value))


@router.get("/me", response_model=UserOut)
async def me(user: CurrentUser):
    return user
