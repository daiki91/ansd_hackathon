"""Domaine Santé : consultation des établissements de santé (tableau de bord
"Santé" -- RF-02, et brique de base du moteur de croisement -- RF-18 à RF-21,
cas d'usage 1 du cahier des charges).
"""

from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.health import HealthEstablishment
from app.schemas.health import HealthEstablishmentOut

router = APIRouter(prefix="/health-establishments", tags=["Santé"])


@router.get("", response_model=list[HealthEstablishmentOut], summary="Lister les établissements de santé")
def list_health_establishments(
    region: str | None = None,
    facility_type: str | None = None,
    year: int | None = None,
    db: Session = Depends(get_db),
) -> list[HealthEstablishmentOut]:
    stmt = select(HealthEstablishment)
    if region:
        stmt = stmt.where(HealthEstablishment.region == region)
    if facility_type:
        stmt = stmt.where(HealthEstablishment.facility_type == facility_type)
    if year:
        stmt = stmt.where(HealthEstablishment.year == year)
    rows = db.execute(stmt).scalars().all()
    return [HealthEstablishmentOut.model_validate(r) for r in rows]
