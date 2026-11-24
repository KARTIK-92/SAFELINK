import os
from typing import AsyncGenerator
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.orm import declarative_base, sessionmaker
from sqlalchemy import create_engine

from app.core.config import settings

# Determine DB Engine options
connect_args = {}
engine_kwargs = {
    "echo": False,
    "future": True,
    "pool_pre_ping": True,
}

if "sqlite" in settings.DATABASE_URL:
    connect_args = {"check_same_thread": False}
else:
    # PostgreSQL / Neon / Supabase pooling optimizations
    engine_kwargs.update({
        "pool_recycle": 300,
        "pool_size": 10,
        "max_overflow": 20,
    })

# Async Engine for FastAPI handlers
async_engine = create_async_engine(
    settings.DATABASE_URL,
    connect_args=connect_args,
    **engine_kwargs
)

AsyncSessionLocal = async_sessionmaker(
    bind=async_engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autoflush=False
)

# Sync Engine for Alembic migrations & background workers if needed
sync_connect_args = {}
sync_url = settings.DATABASE_URL_SYNC
if "sqlite" in sync_url:
    sync_connect_args = {"check_same_thread": False}
elif sync_url.startswith("postgresql://"):
    # Ensure compatibility with psycopg2 or psycopg3
    try:
        import psycopg  # noqa: F401
    except ImportError:
        # Fallback to psycopg2 dialect if psycopg (v3) is not present
        sync_url = sync_url.replace("postgresql://", "postgresql+psycopg2://", 1)

sync_engine_kwargs = {
    "echo": False,
    "future": True,
    "pool_pre_ping": True,
}
if "sqlite" not in sync_url:
    sync_engine_kwargs.update({
        "pool_recycle": 300,
        "pool_size": 5,
        "max_overflow": 10,
    })

sync_engine = create_engine(
    sync_url,
    connect_args=sync_connect_args,
    **sync_engine_kwargs
)

SyncSessionLocal = sessionmaker(
    bind=sync_engine,
    autocommit=False,
    autoflush=False
)

Base = declarative_base()


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    """Dependency for providing an async database session per request."""
    async with AsyncSessionLocal() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()
