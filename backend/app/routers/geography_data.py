"""Superficie des régions du Sénégal (donnée statique de référence) --
utilisée par le moteur de croisement pour générer un indicateur de densité
de population (voir app/services/crossing/recipes.py).
"""

from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.geography import RegionArea
from app.schemas.geography import RegionAreaOut

router = APIRouter(prefix="/region-areas", tags=["Géographie"])


@router.get("", response_model=list[RegionAreaOut], summary="Superficie des régions du Sénégal")
def list_region_areas(db: Session = Depends(get_db)) -> list[RegionAreaOut]:
    rows = db.execute(select(RegionArea)).scalars().all()
    return [RegionAreaOut.model_validate(r) for r in rows]
