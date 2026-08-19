"""Domaine Commerce extérieur : exportations/importations du Sénégal par
pays partenaire.

Données d'amorçage sourcées auprès de l'ANSD (Note d'Analyse du Commerce
Extérieur / point 2023), voir data/raw/commerce_exterieur.csv pour le détail
des sources. Comme pour le domaine Santé, ce jeu de données est destiné à
être étendu avec l'export officiel ANSD "Exportations et importations par
pays" une fois récupéré depuis Open Data for Africa.
"""

from sqlalchemy import Float, Integer, String
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


class TradeFlow(Base):
    __tablename__ = "trade_flows"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    year: Mapped[int] = mapped_column(Integer, nullable=False, index=True)
    flow_type: Mapped[str] = mapped_column(String(16), nullable=False, index=True)  # "export" | "import"
    country: Mapped[str] = mapped_column(String(64), nullable=False, index=True)  # "Total" pour l'agrégat national
    share_pct: Mapped[float | None] = mapped_column(Float, nullable=True)
    value_fcfa_billions: Mapped[float | None] = mapped_column(Float, nullable=True)
    source: Mapped[str] = mapped_column(String(255), nullable=False)
