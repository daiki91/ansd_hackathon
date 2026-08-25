"""Configuration centralisée de l'application, lue depuis les variables
d'environnement (voir .env.example).

Conformément au cahier des charges (section 6 "Architecture technique"), la
base de données cible est Supabase (PostgreSQL + PostGIS). Pour permettre à
n'importe quel développeur de lancer l'API immédiatement, sans dépendre d'un
projet Supabase déjà configuré, DATABASE_URL retombe par défaut sur un
fichier SQLite local si elle n'est pas définie.
"""

from functools import lru_cache
from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict

BASE_DIR = Path(__file__).resolve().parent.parent.parent


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    PROJECT_NAME: str = "DATA LINK API"
    API_V1_PREFIX: str = "/api/v1"
    ENVIRONMENT: str = "development"

    # Base de données : chaîne de connexion Supabase/PostgreSQL en production,
    # SQLite local par défaut pour le développement.
    DATABASE_URL: str = f"sqlite:///{BASE_DIR / 'datalink.db'}"

    # CORS : origines autorisées (le frontend Vite tourne sur le port 5173 par défaut)
    CORS_ORIGINS: str = "http://localhost:5173"

    # Sécurité API (RNF-03 du cahier des charges)
    API_KEYS: str = ""
    REQUIRE_API_KEY: bool = False

    # Anthropic Claude API (pour le chatbot RAG)
    ANTHROPIC_API_KEY: str = ""

    @property
    def cors_origins_list(self) -> list[str]:
        return [origin.strip() for origin in self.CORS_ORIGINS.split(",") if origin.strip()]

    @property
    def api_keys_set(self) -> set[str]:
        return {key.strip() for key in self.API_KEYS.split(",") if key.strip()}


@lru_cache
def get_settings() -> Settings:
    return Settings()
