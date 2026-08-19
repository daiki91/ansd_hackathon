"""Domaine Population : population résidente du Sénégal par région et par
année -- jeu de données transversal servant de base de croisement avec les
autres domaines (santé, éducation, emploi, agriculture -- section 7 du
cahier des charges).

Données d'amorçage sourcées auprès de l'ANSD (5e Recensement Général de la
Population et de l'Habitat, RGPH-5, résultats publiés le 31/10/2023), voir
data/raw/population.csv pour le détail des sources.
"""

from sqlalchemy import Float, Integer, String
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


class Population(Base):
    __tablename__ = "population"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    region: Mapped[str] = mapped_column(String(64), nullable=False, index=True)
    count: Mapped[float] = mapped_column(Float, nullable=False)
    share_pct: Mapped[float | None] = mapped_column(Float, nullable=True)
    year: Mapped[int] = mapped_column(Integer, nullable=False, index=True)
    source: Mapped[str] = mapped_column(String(255), nullable=False)
