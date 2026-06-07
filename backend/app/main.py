import asyncio
import contextlib
import logging
from collections.abc import AsyncIterator

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from slowapi.util import get_remote_address

from app.core.config import settings
from app.core.database import session_factory
from app.core.exceptions import register_exception_handlers
from app.core.middleware import SecurityHeadersMiddleware
from app.modules.alarms.router import router as alarms_router
from app.modules.apps.router import router as apps_router
from app.modules.auth.router import router as auth_router
from app.modules.containers.router import router as containers_router
from app.modules.engine import service as engine_service
from app.modules.engine.router import router as engine_router
from app.modules.metrics.router import router as metrics_router
from app.modules.notifications.router import router as notifications_router
from app.modules.rules.router import router as rules_router
from app.modules.settings.router import router as settings_router
from app.modules.simulator import service as simulator_service

limiter = Limiter(key_func=get_remote_address, default_limits=[settings.rate_limit])
logger = logging.getLogger("sentinel.engine")


async def _periodic(interval: int, runner, label: str) -> None:
    while True:
        await asyncio.sleep(interval)
        try:
            async with session_factory() as db:
                result = await runner(db)
            if any(result.values()):
                logger.info("%s %s", label, result)
        except Exception:
            logger.exception("%s failed", label)


@contextlib.asynccontextmanager
async def lifespan(_: FastAPI) -> AsyncIterator[None]:
    tasks: list[asyncio.Task] = []
    if settings.simulator_enabled:
        tasks.append(asyncio.create_task(_periodic(settings.simulator_interval, simulator_service.tick, "simulator")))
    if settings.engine_enabled:
        tasks.append(asyncio.create_task(_periodic(settings.engine_interval, engine_service.run_cycle, "engine")))
    try:
        yield
    finally:
        for task in tasks:
            task.cancel()
        for task in tasks:
            with contextlib.suppress(asyncio.CancelledError):
                await task


def create_app() -> FastAPI:
    app = FastAPI(title=settings.app_name, version="0.1.0", lifespan=lifespan)

    app.state.limiter = limiter
    app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

    app.add_middleware(SecurityHeadersMiddleware)
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    register_exception_handlers(app)

    @app.get("/health", tags=["health"])
    async def health() -> dict:
        return {"status": "ok"}

    app.include_router(auth_router)
    app.include_router(apps_router)
    app.include_router(containers_router)
    app.include_router(metrics_router)
    app.include_router(alarms_router)
    app.include_router(rules_router)
    app.include_router(notifications_router)
    app.include_router(settings_router)
    app.include_router(engine_router)

    return app


app = create_app()
