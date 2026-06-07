from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import NotFoundError
from app.modules.rules.models import AlarmRule, RemediationRule


async def _list(db: AsyncSession, model):
    result = await db.execute(select(model).order_by(model.created_at))
    return list(result.scalars().all())


async def _get(db: AsyncSession, model, rule_id: str, label: str):
    rule = await db.get(model, rule_id)
    if not rule:
        raise NotFoundError(f"{label} not found")
    return rule


async def _create(db: AsyncSession, instance):
    db.add(instance)
    await db.commit()
    await db.refresh(instance)
    return instance


async def _update(db: AsyncSession, rule, data: dict):
    for field, value in data.items():
        setattr(rule, field, value)
    await db.commit()
    await db.refresh(rule)
    return rule


async def _delete(db: AsyncSession, rule) -> None:
    await db.delete(rule)
    await db.commit()


async def list_alarm_rules(db: AsyncSession) -> list[AlarmRule]:
    return await _list(db, AlarmRule)


async def get_alarm_rule(db: AsyncSession, rule_id: str) -> AlarmRule:
    return await _get(db, AlarmRule, rule_id, "Alarm rule")


async def create_alarm_rule(db: AsyncSession, payload) -> AlarmRule:
    return await _create(db, AlarmRule(**payload.model_dump()))


async def update_alarm_rule(db: AsyncSession, rule_id: str, payload) -> AlarmRule:
    rule = await get_alarm_rule(db, rule_id)
    return await _update(db, rule, payload.model_dump(exclude_unset=True))


async def delete_alarm_rule(db: AsyncSession, rule_id: str) -> None:
    await _delete(db, await get_alarm_rule(db, rule_id))


async def list_remediation_rules(db: AsyncSession) -> list[RemediationRule]:
    return await _list(db, RemediationRule)


async def get_remediation_rule(db: AsyncSession, rule_id: str) -> RemediationRule:
    return await _get(db, RemediationRule, rule_id, "Remediation rule")


async def create_remediation_rule(db: AsyncSession, payload) -> RemediationRule:
    return await _create(db, RemediationRule(**payload.model_dump()))


async def update_remediation_rule(db: AsyncSession, rule_id: str, payload) -> RemediationRule:
    rule = await get_remediation_rule(db, rule_id)
    return await _update(db, rule, payload.model_dump(exclude_unset=True))


async def delete_remediation_rule(db: AsyncSession, rule_id: str) -> None:
    await _delete(db, await get_remediation_rule(db, rule_id))
