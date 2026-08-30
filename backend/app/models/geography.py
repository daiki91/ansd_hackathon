"""Données de référence géographiques statiques (pas de série temporelle) :
superficie des régions du Sénégal, utilisée par le moteur de croisement pour
générer des indicateurs de densité (voir app/services/crossing/recipes.py).

Donnée externe (non-ANSD directe), voir data/raw/superficie_regions.csv pour
le détail de la source et de la validation (somme = superficie nationale).
"""

from sqlalchemy import Float, Integer, String
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


class RegionArea(Base):
    __tablename__ = "region_areas"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    region: Mapped[str] = mapped_column(String(64), nullable=False, unique=True, index=True)
    area_km2: Mapped[float] = mapped_column(Float, nullable=False)
    source: Mapped[str] = mapped_column(String(255), nullable=False)
