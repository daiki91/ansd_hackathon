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
from app.services.data_service import load_projections, load_department_projections
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


@router.get("/projections", summary="Projections démographiques ANSD 2023-2050")
def get_projections(
    region: str | None = None,
    year: int | None = None,
    level: str = "regions",
):
    """Projections démographiques officielles ANSD (base RGPH-5 2023).

    Source : fichier "Projections démographiques du Sénégal 2023-2050"
    (ansd.sn). 2023 = recensement RGPH-5 ; 2024+ = projections officielles
    qui font foi jusqu'au prochain recensement.

    level : "regions" (14) ou "departements" (46, incl. Keur Massar).
    """
    if level == "departements":
        rows = load_department_projections()
        key = "departement"
        label = "départements"
    else:
        rows = load_projections()
        key = "region"
        label = "régions"
    if region:
        rows = [r for r in rows if r.get(key, "").lower() == region.lower()]
    if year:
        rows = [r for r in rows if r.get("year") == year]
        return {
            "projections": [{key: r[key], "year": r["year"], "population": r["population"]} for r in rows],
            "source": f"ANSD — Projections démographiques 2023-2050 ({label}, base RGPH-5)",
            "base_year": 2023,
            "level": label,
        }
    return {
        "projections": rows,
        "source": f"ANSD — Projections démographiques 2023-2050 ({label}, base RGPH-5)",
        "base_year": 2023,
        "level": label,
    }
