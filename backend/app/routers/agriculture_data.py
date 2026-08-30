"""Domaine Agriculture : production nette de céréales et importations de
céréales (séries nationales annuelles) -- cas d'usage 2 du cahier des
charges (section 10 : "Production agricole + Importations -> dépendance").
"""

from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.agriculture import AgricultureProduction, CerealImports
from app.schemas.agriculture import AgricultureProductionOut, CerealImportsOut

router = APIRouter(prefix="/agriculture", tags=["Agriculture"])


@router.get(
    "/production",
    response_model=list[AgricultureProductionOut],
    summary="Production nette de céréales par année (série nationale)",
)
def list_production(year: int | None = None, db: Session = Depends(get_db)) -> list[AgricultureProductionOut]:
    stmt = select(AgricultureProduction).order_by(AgricultureProduction.year)
    if year:
        stmt = stmt.where(AgricultureProduction.year == year)
    rows = db.execute(stmt).scalars().all()
    return [AgricultureProductionOut.model_validate(r) for r in rows]


@router.get(
    "/imports",
    response_model=list[CerealImportsOut],
    summary="Importations de céréales par année (série nationale)",
)
def list_imports(year: int | None = None, db: Session = Depends(get_db)) -> list[CerealImportsOut]:
    stmt = select(CerealImports).order_by(CerealImports.year)
    if year:
        stmt = stmt.where(CerealImports.year == year)
    rows = db.execute(stmt).scalars().all()
    return [CerealImportsOut.model_validate(r) for r in rows]
