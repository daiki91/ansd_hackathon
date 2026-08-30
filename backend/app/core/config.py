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
from sqlalchemy.engine import URL

BASE_DIR = Path(__file__).resolve().parent.parent.parent


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    PROJECT_NAME: str = "DATA LINK API"
    API_V1_PREFIX: str = "/api/v1"
    ENVIRONMENT: str = "development"

    # Base de données : chaîne de connexion Supabase/PostgreSQL en production,
    # SQLite local par défaut pour le développement.
    DATABASE_URL: str = f"sqlite:///{BASE_DIR / 'datalink.db'}"

    # Composants optionnels de connexion Postgres/Supabase. S'ils sont tous
    # renseignés, ils priment sur DATABASE_URL et sont assemblés avec
    # sqlalchemy.engine.URL.create(), qui encode automatiquement les
    # caractères spéciaux du mot de passe (@, /, #, :, ...). Cela évite les
    # erreurs de résolution DNS causées par un mot de passe contenant un "@"
    # collé tel quel dans une URI (ex: DATABASE_URL=...:mon@mdp@host:...).
    DB_HOST: str = ""
    DB_PORT: int = 5432
    DB_NAME: str = "postgres"
    DB_USER: str = ""
    DB_PASSWORD: str = ""

    # CORS : origines autorisées (le frontend Vite tourne sur le port 5173 par défaut)
    CORS_ORIGINS: str = "http://localhost:5173"

    # Sécurité API (RNF-03 du cahier des charges)
    API_KEYS: str = ""
    REQUIRE_API_KEY: bool = False

    # Anthropic Claude API (pour le chatbot RAG)
    ANTHROPIC_API_KEY: str = ""

    # Active/desactive l'assistant IA (RAG). A mettre a False en production sur
    # une instance a RAM limitee (ex. Render free 512 Mo) : sentence-transformers
    # charge torch au premier appel, qui consomme a lui seul ~500 Mo de RAM,
    # ce qui depasse la limite. Laisser True en local pour continuer a
    # developper/tester l'assistant normalement.
    ENABLE_RAG_ASSISTANT: bool = True

    @property
    def cors_origins_list(self) -> list[str]:
        return [origin.strip() for origin in self.CORS_ORIGINS.split(",") if origin.strip()]

    @property
    def api_keys_set(self) -> set[str]:
        return {key.strip() for key in self.API_KEYS.split(",") if key.strip()}

    @property
    def sqlalchemy_database_url(self) -> str:
        """URL de connexion effective, en construisant proprement la chaîne
        Postgres à partir des composants DB_* si disponibles (voir plus haut),
        sinon en retombant sur DATABASE_URL (SQLite par défaut)."""
        if self.DB_HOST and self.DB_USER and self.DB_PASSWORD:
            return URL.create(
                "postgresql+psycopg2",
                username=self.DB_USER,
                password=self.DB_PASSWORD,
                host=self.DB_HOST,
                port=self.DB_PORT,
                database=self.DB_NAME,
            ).render_as_string(hide_password=False)
        return self.DATABASE_URL


@lru_cache
def get_settings() -> Settings:
    return Settings()
