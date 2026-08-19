"""Domaine Commerce extérieur : exportations/importations du Sénégal par
pays (tableau de bord "Économie" -- RF-02, cas d'usage 2 du cahier des
charges).
"""

from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.trade import TradeFlow
from app.schemas.trade import TradeFlowOut

router = APIRouter(prefix="/trade", tags=["Commerce extérieur"])


@router.get("", response_model=list[TradeFlowOut], summary="Lister les flux commerciaux")
def list_trade_flows(
    flow_type: str | None = None,
    country: str | None = None,
    year: int | None = None,
    db: Session = Depends(get_db),
) -> list[TradeFlowOut]:
    stmt = select(TradeFlow)
    if flow_type:
        stmt = stmt.where(TradeFlow.flow_type == flow_type)
    if country:
        stmt = stmt.where(TradeFlow.country == country)
    if year:
        stmt = stmt.where(TradeFlow.year == year)
    rows = db.execute(stmt).scalars().all()
    return [TradeFlowOut.model_validate(r) for r in rows]
