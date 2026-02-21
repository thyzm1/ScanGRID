"""
Configuration de la base de données SQLite avec SQLAlchemy 2.0
"""
import os
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker
from sqlalchemy.orm import DeclarativeBase
import logging

logger = logging.getLogger(__name__)

# Répertoire persistant pour la base de données
DB_DIR = os.getenv("SCANGRID_DB_DIR", "/var/lib/scangrid")
os.makedirs(DB_DIR, exist_ok=True)

DATABASE_URL = f"sqlite+aiosqlite:///{DB_DIR}/gridfinity.db"

# Création du moteur asynchrone
engine = create_async_engine(
    DATABASE_URL,
    echo=False,  # Mettre à True pour voir les requêtes SQL en dev
    future=True,
)

# Session factory
async_session_maker = async_sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False,
)


class Base(DeclarativeBase):
    """Classe de base pour tous les modèles SQLAlchemy"""
    pass


async def init_db():
    """Initialise la base de données en créant toutes les tables"""
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    logger.info(f"Base de données initialisée à {DATABASE_URL}")


async def get_db():
    """Générateur de session pour dependency injection FastAPI"""
    async with async_session_maker() as session:
        try:
            yield session
        finally:
            await session.close()
