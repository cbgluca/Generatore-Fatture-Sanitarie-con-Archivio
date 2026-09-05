"""
database.py — Configurazione della connessione SQLite e sessione SQLAlchemy.

Il file ricevute.db viene creato nella root del progetto.
"""

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, DeclarativeBase

# Percorso del database SQLite (file locale persistente)
DATABASE_URL = "sqlite:///./ricevute.db"

engine = create_engine(
    DATABASE_URL,
    connect_args={"check_same_thread": False},  # Necessario per SQLite con FastAPI
    echo=False,
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


class Base(DeclarativeBase):
    """Classe base dichiarativa per tutti i modelli ORM."""
    pass


def get_db():
    """Dependency FastAPI: fornisce una sessione DB e la chiude dopo l'uso."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
