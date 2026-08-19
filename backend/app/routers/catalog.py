"""Catalogue de données (RF-14, RF-17) : liste des jeux de données intégrés,
leurs métadonnées, et leur téléchargement en plusieurs formats.
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.security import require_api_key
from app.db.session import get_db
from app.models.dataset import Dataset
from app.models.health import HealthEstablishment
from app.models.indicator import Indicator
from app.models.population import Population
from app.models.trade import TradeFlow
from app.schemas.dataset import DatasetOut
from app.services.export import ExportFormat, export_records

router = APIRouter(prefix="/catalog", tags=["Catalogue de données"])

# Table SQL -> modèle ORM, pour retrouver les enregistrements bruts d'un
# dataset du catalogue au moment de l'export (RF-14).
_TABLE_MODELS = {
    "health_establishments": HealthEstablishment,
    "trade_flows": TradeFlow,
    "population": Population,
    "indicators": Indicator,
}


@router.get("", response_model=list[DatasetOut], summary="Lister les jeux de données du catalogue")
def list_datasets(domain: str | None = None, db: Session = Depends(get_db)) -> list[DatasetOut]:
    stmt = select(Dataset)
    if domain:
        stmt = stmt.where(Dataset.domain == domain)
    datasets = db.execute(stmt).scalars().all()
    return [DatasetOut.from_orm_model(d) for d in datasets]


@router.get("/{dataset_id}", response_model=DatasetOut, summary="Détail d'un jeu de données")
def get_dataset(dataset_id: str, db: Session = Depends(get_db)) -> DatasetOut:
    dataset = db.get(Dataset, dataset_id)
    if dataset is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Jeu de données introuvable.")
    return DatasetOut.from_orm_model(dataset)


@router.get(
    "/{dataset_id}/download",
    summary="Télécharger un jeu de données (CSV, Excel ou JSON)",
    dependencies=[Depends(require_api_key)],
)
def download_dataset(dataset_id: str, format: ExportFormat = "csv", db: Session = Depends(get_db)):
    dataset = db.get(Dataset, dataset_id)
    if dataset is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Jeu de données introuvable.")

    model = _TABLE_MODELS.get(dataset.table_name)
    if model is None:
        raise HTTPException(
            status_code=status.HTTP_501_NOT_IMPLEMENTED,
            detail="Export non encore disponible pour ce jeu de données.",
        )

    rows = db.execute(select(model)).scalars().all()
    records = [
        {c.name: getattr(row, c.name) for c in model.__table__.columns}  # type: ignore[attr-defined]
        for row in rows
    ]
    return export_records(records, format, filename=dataset_id)
