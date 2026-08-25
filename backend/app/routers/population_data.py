"""Domaine Population : population résidente du Sénégal par région (tableau
de bord "Population" -- RF-02, jeu de données transversal -- section 7 du
cahier des charges).

Données :
  - RGPH-5 (2023) : dernier recensement officiel (ANSD, 31/10/2023)
  - Projections 2023-2073 : extraites du PDF ANSD "Projections démographiques
    2023-2073", utilisées jusqu'au prochain recensement
"""

from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.population import Population
from app.schemas.population import PopulationOut
from app.services.data_service import load_projections

router = APIRouter(prefix="/population", tags=["Population"])


@router.get("", response_model=list[PopulationOut], summary="Lister la population par région")
def list_population(
    region: str | None = None,
    year: int | None = None,
    db: Session = Depends(get_db),
) -> list[PopulationOut]:
    stmt = select(Population)
    if region:
        stmt = stmt.where(Population.region == region)
    if year:
        stmt = stmt.where(Population.year == year)
    rows = db.execute(stmt).scalars().all()
    return [PopulationOut.model_validate(r) for r in rows]


@router.get("/projections", summary="Projections démographiques 2023-2073 par région")
def get_projections(region: str | None = None, year: int | None = None):
    """Projections démographiques issues du RGPH-5 (ANSD).

    Le RGPH-5 (2023) est le dernier recensement. Ces projections couvrent
    2023-2028 (extract) et sont la base officielle jusqu'au prochain
    recensement.
    """
    rows = load_projections()
    if region:
        rows = [r for r in rows if r.get("region", "").lower() == region.lower()]
    if year:
        col = f"population_{year}"
        rows = [{"region": r["region"], "year": year, "population": int(r.get(col, 0))} for r in rows if col in r]
    return {"projections": rows, "source": "ANSD RGPH-5 (Projections démographiques 2023-2073)", "base_year": 2023}
