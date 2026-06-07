from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import ConflictError, NotFoundError
from app.modules.apps.models import App
from app.modules.apps.schemas import AppCreate, AppUpdate


async def list_apps(db: AsyncSession) -> list[App]:
    result = await db.execute(select(App).order_by(App.name))
    return list(result.scalars().all())


async def get_app(db: AsyncSession, app_id: str) -> App:
    app = await db.get(App, app_id)
    if not app:
        raise NotFoundError("App not found")
    return app


async def create_app(db: AsyncSession, payload: AppCreate) -> App:
    existing = await db.execute(select(App).where(App.name == payload.name))
    if existing.scalar_one_or_none():
        raise ConflictError("An app with this name already exists")
    app = App(
        name=payload.name,
        description=payload.description,
        env=payload.env,
        compose_path=payload.compose_path,
        gcp_project=payload.gcp_project,
        auth_method=payload.auth_method,
        collect_interval=payload.collect_interval,
        credential_ref=payload.credential_ref,
        vm_instance=payload.vm.instance,
        vm_zone=payload.vm.zone,
        vm_machine=payload.vm.machine,
        vm_ip=payload.vm.ip,
        vm_os=payload.vm.os,
    )
    db.add(app)
    await db.commit()
    await db.refresh(app)
    return app


async def update_app(db: AsyncSession, app_id: str, payload: AppUpdate) -> App:
    app = await get_app(db, app_id)
    data = payload.model_dump(exclude_unset=True)
    if "vm" in data:
        vm = data.pop("vm")
        app.vm_instance = vm["instance"]
        app.vm_zone = vm["zone"]
        app.vm_machine = vm["machine"]
        app.vm_ip = vm["ip"]
        app.vm_os = vm["os"]
    for field in ("description", "env", "health", "auth_method", "compose_path", "collect_interval"):
        if field in data:
            setattr(app, field, data[field])
    if "gcp_project" in data:
        app.gcp_project = data["gcp_project"]
    await db.commit()
    await db.refresh(app)
    return app


async def delete_app(db: AsyncSession, app_id: str) -> None:
    app = await get_app(db, app_id)
    await db.delete(app)
    await db.commit()
