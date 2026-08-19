"""Domaine Population : population résidente du Sénégal par région (tableau
de bord "Population" -- RF-02, jeu de données transversal -- section 7 du
cahier des charges).
"""

from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.population import Population
from app.schemas.population import PopulationOut

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
