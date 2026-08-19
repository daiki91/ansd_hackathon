"""Indicateurs nationaux dynamiques (RF-13 : "Indicateurs économiques et
sociaux dynamiques pour aider entreprises et décideurs à la prise de
décision"), toutes catégories (économie, population...), suivis dans le
temps pour permettre les comparaisons entre périodes (RF-10).

Données d'amorçage sourcées auprès de l'ANSD (croissance du PIB, inflation,
indicateurs démographiques du RGPH-5), voir
data/raw/indicateurs_nationaux.csv pour le détail des sources.
"""

from sqlalchemy import Float, Integer, String
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


class Indicator(Base):
    __tablename__ = "indicators"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    category: Mapped[str] = mapped_column(String(64), nullable=False, index=True)  # "Économie" | "Population"
    indicator: Mapped[str] = mapped_column(String(128), nullable=False, index=True)
    value: Mapped[float] = mapped_column(Float, nullable=False)
    unit: Mapped[str] = mapped_column(String(32), nullable=False, default="")
    year: Mapped[int] = mapped_column(Integer, nullable=False, index=True)
    source: Mapped[str] = mapped_column(String(255), nullable=False)
