from collections.abc import Generator

from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker

from app.core.config import get_settings

settings = get_settings()

# `connect_args` n'est nécessaire que pour SQLite (autorise l'usage multi-thread
# avec le serveur de dev Uvicorn). Il est ignoré pour PostgreSQL/Supabase.
db_url = settings.sqlalchemy_database_url
connect_args = {"check_same_thread": False} if db_url.startswith("sqlite") else {}

engine = create_engine(db_url, connect_args=connect_args, future=True)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine, future=True)


def get_db() -> Generator[Session, None, None]:
    """Dépendance FastAPI fournissant une session DB par requête."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
