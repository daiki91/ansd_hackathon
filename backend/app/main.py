"""Point d'entrée de l'API DATA LINK (FastAPI).

Démarrage local :
    uvicorn app.main:app --reload

Documentation interactive générée automatiquement (RF-17 "Espace
développeurs avec documentation complète de l'API") :
    http://localhost:8000/docs        (Swagger UI)
    http://localhost:8000/redoc       (ReDoc)
"""

from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import get_settings
from app.db.base import Base
from app.db.session import engine
from app.routers import (
    agriculture_data,
    catalog,
    chat,
    crossing,
    data_router,
    geo,
    gdp_data,
    geography_data,
    health_check,
    health_data,
    indicators_data,
    population_data,
    trade_data,
)

settings = get_settings()


@asynccontextmanager
async def lifespan(_: FastAPI):
    # Pour le prototype, les tables sont créées directement depuis les modèles
    # SQLAlchemy. Une fois le projet plus avancé, remplacer par un outil de
    # migration (ex. Alembic) pour gérer l'évolution du schéma en production
    # (Supabase/PostgreSQL) sans perte de données.
    Base.metadata.create_all(bind=engine)
    yield


app = FastAPI(
    title=settings.PROJECT_NAME,
    description=(
        "API de la plateforme DATA LINK -- visualisation, analyse, croisement "
        "et valorisation des données statistiques du Sénégal (ANSD)."
    ),
    version="0.1.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health_check.router)
app.include_router(catalog.router, prefix=settings.API_V1_PREFIX)
app.include_router(health_data.router, prefix=settings.API_V1_PREFIX)
app.include_router(trade_data.router, prefix=settings.API_V1_PREFIX)
app.include_router(population_data.router, prefix=settings.API_V1_PREFIX)
app.include_router(indicators_data.router, prefix=settings.API_V1_PREFIX)
app.include_router(gdp_data.router, prefix=settings.API_V1_PREFIX)
app.include_router(chat.router, prefix=settings.API_V1_PREFIX)
app.include_router(data_router.router, prefix=settings.API_V1_PREFIX)
app.include_router(agriculture_data.router, prefix=settings.API_V1_PREFIX)
app.include_router(geography_data.router, prefix=settings.API_V1_PREFIX)
app.include_router(crossing.router, prefix=settings.API_V1_PREFIX)
app.include_router(geo.router)
