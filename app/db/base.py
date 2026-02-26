"""Declarative base for models (no engine). Used by Alembic so it doesn't load async engine."""
from sqlalchemy.orm import DeclarativeBase


class Base(DeclarativeBase):
    """Base for all models."""
    pass
