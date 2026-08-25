"""Domaine Économie régionale : PIB par région (tableau de bord "Économie"
et moteur de croisement -- RF-02, RF-18 à RF-21 du cahier des charges).

Source : ANSD, "Résultats des comptes économiques régionaux 2020-2023".
"""

from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.gdp import RegionalGdp
from app.schemas.gdp import RegionalGdpOut

router = APIRouter(prefix="/regional-gdp", tags=["Économie régionale"])


@router.get("", response_model=list[RegionalGdpOut], summary="Lister le PIB par région")
def list_regional_gdp(
    region: str | None = None,
    year: int | None = None,
    db: Session = Depends(get_db),
) -> list[RegionalGdpOut]:
    stmt = select(RegionalGdp)
    if region:
        stmt = stmt.where(RegionalGdp.region == region)
    if year:
        stmt = stmt.where(RegionalGdp.year == year)
    rows = db.execute(stmt).scalars().all()
    return [RegionalGdpOut.model_validate(r) for r in rows]
