# Sentinel Backend

FastAPI backend for **Sentinel** — the container monitoring & alarm panel. Modular
("app-based") architecture: every domain lives in a self-contained module under
`app/modules/<name>` exposing `models`, `schemas`, `service` and `router`.

## Stack

- **Python 3.13 + FastAPI** (async)
- **SQLAlchemy 2.0** (async) — SQLite in dev, PostgreSQL in prod via `DATABASE_URL`
- **Alembic** — schema migrations
- **Pydantic v2** — validation; snake_case in Python, **camelCase** on the wire and in the DB
- **JWT + Argon2** auth, role-based access, rate limiting, security headers

## Layout

```
app/
  core/        config, database, security, exceptions, shared schema base
  modules/
    auth/          users, login, roles
    apps/          monitored apps + VM info
    containers/    containers, lifecycle actions, logs
    metrics/       time-series samples
    alarms/        alarms/incidents + timeline
    rules/         alarm rules + auto-remediation rules
    notifications/ notification channels
    settings/      general configuration
alembic/       migration environment and versions
```

## Setup

```bash
cd backend
python3 -m venv .venv && source .venv/bin/activate
pip install -e .
cp .env.example .env          # then set JWT_SECRET

alembic upgrade head          # create the schema
python -m app.seed            # load demo fleet (optional)

uvicorn app.main:app --reload # http://localhost:8000/docs
```

## Conventions

- Request/response bodies and DB columns are **camelCase**; Python identifiers are
  **snake_case**. The `CamelModel` base (`app/core/schema.py`) bridges the two.
- Errors share one envelope: `{ "error": { "code", "message", "details" } }`.
- Secrets (SSH keys, service-account JSON) are never stored raw — only a `credentialRef`.
