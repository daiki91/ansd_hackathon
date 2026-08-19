"""Indicateurs nationaux dynamiques, toutes catégories (RF-13 : tableau de
bord "Économie" et suivi d'indicateurs démographiques dans le temps).
"""

from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.indicator import Indicator
from app.schemas.indicator import IndicatorOut

router = APIRouter(prefix="/indicators", tags=["Indicateurs"])


@router.get("", response_model=list[IndicatorOut], summary="Lister les indicateurs nationaux")
def list_indicators(
    category: str | None = None,
    indicator: str | None = None,
    year: int | None = None,
    db: Session = Depends(get_db),
) -> list[IndicatorOut]:
    stmt = select(Indicator)
    if category:
        stmt = stmt.where(Indicator.category == category)
    if indicator:
        stmt = stmt.where(Indicator.indicator == indicator)
    if year:
        stmt = stmt.where(Indicator.year == year)
    rows = db.execute(stmt).scalars().all()
    return [IndicatorOut.model_validate(r) for r in rows]
