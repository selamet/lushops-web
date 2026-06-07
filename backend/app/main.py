from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from slowapi.util import get_remote_address

from app.core.config import settings
from app.core.exceptions import register_exception_handlers
from app.core.middleware import SecurityHeadersMiddleware
from app.modules.apps.router import router as apps_router
from app.modules.auth.router import router as auth_router
from app.modules.containers.router import router as containers_router
from app.modules.alarms.router import router as alarms_router
from app.modules.metrics.router import router as metrics_router

limiter = Limiter(key_func=get_remote_address, default_limits=[settings.rate_limit])


def create_app() -> FastAPI:
    app = FastAPI(title=settings.app_name, version="0.1.0")

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

    return app


app = create_app()
