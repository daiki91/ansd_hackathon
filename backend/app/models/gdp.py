"""Domaine Économie régionale : PIB par région (comptes régionaux ANSD).

Données sourcées auprès de l'ANSD ("Résultats des comptes économiques
régionaux 2020-2023", voir data/raw/regional_gdp.csv).
"""

from sqlalchemy import Float, Integer, String
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


class RegionalGdp(Base):
    __tablename__ = "regional_gdp"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    region: Mapped[str] = mapped_column(String(64), nullable=False, index=True)
    year: Mapped[int] = mapped_column(Integer, nullable=False, index=True)
    pib_volume_mds: Mapped[float | None] = mapped_column(Float, nullable=True)
    pib_valeur_mds: Mapped[float | None] = mapped_column(Float, nullable=True)
    part_primaire_pct: Mapped[float | None] = mapped_column(Float, nullable=True)
    part_secondaire_pct: Mapped[float | None] = mapped_column(Float, nullable=True)
    part_tertiaire_pct: Mapped[float | None] = mapped_column(Float, nullable=True)
