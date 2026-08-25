"""Domaine Agriculture : production nette de céréales et importations de
céréales du Sénégal, séries nationales annuelles (pas de ventilation
régionale disponible dans la source).

Volontairement deux tables séparées (et non fusionnées en une seule) : ce
sont deux jeux de données indépendants du catalogue, croisés par le moteur
de croisement sur la dimension "année" (voir
app/services/crossing/adapters.py) -- démonstration du cas d'usage 2 du
cahier des charges (section 10 : "Production agricole + Importations ->
dépendance").

Données d'amorçage sourcées auprès de l'ANSD/DAPSA (BADIS 2018), voir
scripts/build_agriculture_csv.py et data/raw/agriculture_*.csv pour le
détail des sources et de la méthode d'extraction.
"""

from sqlalchemy import Float, Integer, String
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


class AgricultureProduction(Base):
    __tablename__ = "agriculture_production"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    year: Mapped[int] = mapped_column(Integer, nullable=False, unique=True, index=True)
    production_nette_tonnes: Mapped[float] = mapped_column(Float, nullable=False)
    source: Mapped[str] = mapped_column(String(255), nullable=False)


class CerealImports(Base):
    __tablename__ = "cereal_imports"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    year: Mapped[int] = mapped_column(Integer, nullable=False, unique=True, index=True)
    import_tonnes: Mapped[float] = mapped_column(Float, nullable=False)
    source: Mapped[str] = mapped_column(String(255), nullable=False)
