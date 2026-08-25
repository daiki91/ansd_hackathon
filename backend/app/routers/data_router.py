"""Endpoint de rafraîchissement des données en temps réel.

GET  /api/v1/data/refresh  → Refresh toutes les données depuis les sources officielles
GET  /api/v1/data/freshness → État de fraîcheur des données (dernier fetch, source, statut)
"""

from fastapi import APIRouter

from app.services.data_service import refresh_all, get_freshness

router = APIRouter(prefix="/data", tags=["Données"])


@router.get("/refresh", summary="Rafraîchir les données depuis les sources officielles")
def refresh_data():
    """Refresh toutes les données depuis les sources officielles (ANSD, Open Data
    Sénégal, Open Data for Africa) avec fallback sur les CSV locaux.

    Stratégie :
      - Population : Open Data Sénégal CKAN → CSV local (RGPH-5 + projections 2023-2073)
      - Santé : Open Data for Africa → CSV local (MSAS 2017-2022)
      - Indicateurs : Open Data Sénégal CKAN → CSV local (2020-2024)
      - Commerce : CSV local (ANSD)

    Le RGPH-5 (2023) est la dernière base de recensement. Les projections
    2023-2073 sont utilisées jusqu'au prochain recensement.
    """
    return refresh_all()


@router.get("/freshness", summary="État de fraîcheur des données")
def data_freshness():
    """Retourne pour chaque domaine la source utilisée, le statut (live/local_cache),
    et la date du dernier fetch."""
    return get_freshness()
