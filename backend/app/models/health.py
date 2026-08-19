"""Domaine Santé : nombre d'établissements de santé par type/région/année.

Données d'amorçage sourcées auprès de l'ANSD / Ministère de la Santé et de
l'Action Sociale (voir data/raw/etablissements_sante.csv et son en-tête pour
le détail des sources). Ce jeu de données est volontairement partiel à ce
stade (voir README backend) : il est destiné à être complété par l'export
officiel du jeu de données ANSD "Établissements de santé" une fois récupéré
manuellement depuis Open Data for Africa.
"""

from sqlalchemy import Float, Integer, String
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


class HealthEstablishment(Base):
    __tablename__ = "health_establishments"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    region: Mapped[str] = mapped_column(String(64), nullable=False, index=True)
    facility_type: Mapped[str] = mapped_column(String(64), nullable=False, index=True)
    count: Mapped[float] = mapped_column(Float, nullable=False)
    year: Mapped[int] = mapped_column(Integer, nullable=False, index=True)
    source: Mapped[str] = mapped_column(String(255), nullable=False)
