from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.settings.models import Setting
from app.modules.settings.schemas import GeneralSettings, GeneralSettingsUpdate


async def get_general(db: AsyncSession) -> GeneralSettings:
    result = await db.execute(select(Setting))
    stored = {row.key: row.value for row in result.scalars().all()}
    return GeneralSettings(**{**GeneralSettings().model_dump(), **stored})


async def update_general(db: AsyncSession, payload: GeneralSettingsUpdate) -> GeneralSettings:
    for key, value in payload.model_dump(exclude_unset=True).items():
        existing = await db.get(Setting, key)
        if existing:
            existing.value = value
        else:
            db.add(Setting(key=key, value=value))
    await db.commit()
    return await get_general(db)
