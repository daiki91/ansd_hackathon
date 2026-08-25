"""Adaptateurs de jeux de données pour le moteur de croisement (RF-18/RF-19).

Chaque jeu de données du catalogue (app/models/dataset.py) vit dans sa propre
table SQL, avec un schéma différent (Population = région+année, TradeFlow =
pays+année, Indicator = catégorie+année, superficie = région seule...). Le
moteur de croisement (app/services/crossing/engine.py) ne doit pas connaître
ces différences : chaque table expose un petit adaptateur qui la présente
sous une interface commune {dimension: {valeur_normalisée: mesure}}.

C'est ce registre -- pas le champ texte `Dataset.compatible_dataset_ids`,
qui reste un simple résumé lisible pour le catalogue -- qui fait autorité
pour détecter automatiquement les dimensions communes entre jeux de données
(RF-18).
"""

from dataclasses import dataclass, field
from typing import Literal

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.db.base import Base
from app.models.agriculture import AgricultureProduction, CerealImports
from app.models.gdp import RegionalGdp
from app.models.geography import RegionArea
from app.models.health import HealthEstablishment
from app.models.indicator import Indicator
from app.models.population import Population
from app.models.trade import TradeFlow
from app.services.crossing.text import normalize_name

Agg = Literal["sum", "mean", "last"]


@dataclass(frozen=True)
class DimensionSpec:
    column: str
    exclude_values: frozenset[str] = field(default_factory=frozenset)

    @property
    def exclude_normalized(self) -> frozenset[str]:
        return frozenset(normalize_name(v) for v in self.exclude_values)


@dataclass(frozen=True)
class MeasureSpec:
    column: str
    label: str
    unit: str
    kind: str
    agg: Agg = "sum"


@dataclass(frozen=True)
class DatasetAdapter:
    dataset_id: str
    label: str
    model: type[Base]
    source: str
    dimensions: dict[str, DimensionSpec]
    measures: dict[str, MeasureSpec]

    def default_measure(self) -> str:
        return next(iter(self.measures))

    def load_dimension_table(
        self,
        db: Session,
        dimension: str,
        measure: str,
        year: int | None = None,
    ) -> tuple[dict[str, float], int | None, dict[str, str]]:
        """Retourne {valeur_dimension_normalisée: mesure_agrégée} pour ce jeu
        de données, l'année effectivement utilisée pour le filtre (utile
        quand l'appelant n'a pas précisé d'année et qu'on retombe sur la plus
        récente disponible -- pour ne jamais mélanger silencieusement
        plusieurs années dans une même agrégation par zone), et un mapping
        {valeur_normalisée: libellé d'affichage} pour restituer un nom lisible
        côté API/frontend plutôt que la clé normalisée (sans accents)."""

        if dimension not in self.dimensions:
            raise ValueError(f"dimension '{dimension}' non supportée par {self.dataset_id}")
        if measure not in self.measures:
            raise ValueError(f"mesure '{measure}' non supportée par {self.dataset_id}")

        dim_spec = self.dimensions[dimension]
        measure_spec = self.measures[measure]
        dim_col = getattr(self.model, dim_spec.column)
        measure_col = getattr(self.model, measure_spec.column)

        effective_year: int | None = None
        stmt = select(dim_col, measure_col)

        has_year_dim = "year" in self.dimensions and dimension != "year"
        if has_year_dim:
            year_col = getattr(self.model, self.dimensions["year"].column)
            if year is not None:
                effective_year = year
            else:
                latest = db.execute(select(year_col).order_by(year_col.desc())).scalars().first()
                effective_year = latest
            if effective_year is not None:
                stmt = stmt.where(year_col == effective_year)

        rows = db.execute(stmt).all()

        buckets: dict[str, list[float]] = {}
        display_names: dict[str, str] = {}
        for dim_val, measure_val in rows:
            if dim_val is None or measure_val is None:
                continue
            raw = str(dim_val)
            key = normalize_name(raw)
            if key in dim_spec.exclude_normalized:
                continue
            buckets.setdefault(key, []).append(float(measure_val))
            display_names.setdefault(key, raw)

        out: dict[str, float] = {}
        for key, values in buckets.items():
            if measure_spec.agg == "sum":
                out[key] = sum(values)
            elif measure_spec.agg == "mean":
                out[key] = sum(values) / len(values)
            else:  # "last" -- dernière valeur rencontrée (ordre non garanti pour l'instant)
                out[key] = values[-1]

        return out, effective_year, display_names


ADAPTERS: dict[str, DatasetAdapter] = {
    "population": DatasetAdapter(
        dataset_id="population",
        label="Population",
        model=Population,
        source="ANSD (RGPH-5, 2023)",
        dimensions={
            "region": DimensionSpec(column="region", exclude_values=frozenset({"National"})),
            "year": DimensionSpec(column="year"),
        },
        measures={"count": MeasureSpec(column="count", label="Population", unit="hab.", kind="population_count", agg="last")},
    ),
    "etablissements-sante": DatasetAdapter(
        dataset_id="etablissements-sante",
        label="Établissements de santé",
        model=HealthEstablishment,
        source="ANSD / Ministère de la Santé et de l'Action Sociale (MSAS)",
        dimensions={
            "region": DimensionSpec(column="region", exclude_values=frozenset({"National"})),
            "year": DimensionSpec(column="year"),
        },
        measures={"count": MeasureSpec(column="count", label="Établissements de santé", unit="établ.", kind="facility_count", agg="sum")},
    ),
    "regional-gdp": DatasetAdapter(
        dataset_id="regional-gdp",
        label="PIB régional",
        model=RegionalGdp,
        source="ANSD (Comptes économiques régionaux 2020-2023)",
        dimensions={
            "region": DimensionSpec(column="region"),
            "year": DimensionSpec(column="year"),
        },
        measures={
            "pib_volume_mds": MeasureSpec(column="pib_volume_mds", label="PIB (volume)", unit="Mds FCFA", kind="gdp_value", agg="last"),
            "pib_valeur_mds": MeasureSpec(column="pib_valeur_mds", label="PIB (valeur)", unit="Mds FCFA", kind="gdp_value", agg="last"),
        },
    ),
    "indicateurs-nationaux": DatasetAdapter(
        dataset_id="indicateurs-nationaux",
        label="Indicateurs nationaux",
        model=Indicator,
        source="ANSD / Direction générale du Trésor",
        dimensions={"year": DimensionSpec(column="year")},
        measures={"value": MeasureSpec(column="value", label="Indicateur", unit="", kind="generic_value", agg="last")},
    ),
    "commerce-exterieur": DatasetAdapter(
        dataset_id="commerce-exterieur",
        label="Commerce extérieur",
        model=TradeFlow,
        source="ANSD (Note d'Analyse du Commerce Extérieur)",
        dimensions={
            "country": DimensionSpec(column="country", exclude_values=frozenset({"Total"})),
            "year": DimensionSpec(column="year"),
        },
        measures={"value_fcfa_billions": MeasureSpec(column="value_fcfa_billions", label="Commerce extérieur", unit="Mds FCFA", kind="trade_value", agg="sum")},
    ),
    "superficie-regions": DatasetAdapter(
        dataset_id="superficie-regions",
        label="Superficie régionale",
        model=RegionArea,
        source="Wikipédia (Régions du Sénégal) -- source externe, non-ANSD",
        dimensions={"region": DimensionSpec(column="region")},
        measures={"area_km2": MeasureSpec(column="area_km2", label="Superficie", unit="km²", kind="area_km2", agg="last")},
    ),
    "production-agricole-cereales": DatasetAdapter(
        dataset_id="production-agricole-cereales",
        label="Production de céréales",
        model=AgricultureProduction,
        source="ANSD/DAPSA (BADIS 2018, TABLEAU G.02.01)",
        dimensions={"year": DimensionSpec(column="year")},
        measures={"production_nette_tonnes": MeasureSpec(column="production_nette_tonnes", label="Production nette de céréales", unit="tonnes", kind="production_volume_tonnes", agg="last")},
    ),
    "importations-cereales": DatasetAdapter(
        dataset_id="importations-cereales",
        label="Importations de céréales",
        model=CerealImports,
        source="ANSD/DAPSA (BADIS 2018, TABLEAU G.02.02)",
        dimensions={"year": DimensionSpec(column="year")},
        measures={"import_tonnes": MeasureSpec(column="import_tonnes", label="Importations de céréales", unit="tonnes", kind="import_volume_tonnes", agg="last")},
    ),
}


def get_adapter(dataset_id: str) -> DatasetAdapter:
    if dataset_id not in ADAPTERS:
        raise KeyError(dataset_id)
    return ADAPTERS[dataset_id]


def detect_common_dimensions(dataset_ids: list[str]) -> list[str]:
    """Intersection des dimensions disponibles pour une liste de jeux de
    données (RF-18). Préférence d'affichage : region > country > year."""

    adapters = [get_adapter(did) for did in dataset_ids]
    if not adapters:
        return []
    common = set(adapters[0].dimensions.keys())
    for adapter in adapters[1:]:
        common &= set(adapter.dimensions.keys())
    order = ["region", "country", "year"]
    return [d for d in order if d in common] + sorted(common - set(order))
