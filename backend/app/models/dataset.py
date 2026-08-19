"""Catalogue des jeux de données (RF-14, RF-17, section 4.2.a du cahier des
charges) : chaque jeu de données référencé présente titre, description,
source, période couverte, variables disponibles, niveau géographique, format
et jeux de données compatibles pour le croisement.
"""

from datetime import datetime, timezone

from sqlalchemy import DateTime, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


class Dataset(Base):
    __tablename__ = "datasets"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False, default="")
    domain: Mapped[str] = mapped_column(String(64), nullable=False)  # ex: "Santé", "Commerce extérieur"
    source_name: Mapped[str] = mapped_column(String(255), nullable=False)
    source_url: Mapped[str] = mapped_column(String(512), nullable=False)
    period_covered: Mapped[str] = mapped_column(String(128), nullable=False, default="")
    geographic_level: Mapped[str] = mapped_column(String(128), nullable=False, default="")
    variables: Mapped[str] = mapped_column(Text, nullable=False, default="")  # liste séparée par des virgules
    compatible_dataset_ids: Mapped[str] = mapped_column(Text, nullable=False, default="")
    table_name: Mapped[str] = mapped_column(String(64), nullable=False)  # table SQL contenant les données
    retrieved_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(timezone.utc))
