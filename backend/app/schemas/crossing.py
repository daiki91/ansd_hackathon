from pydantic import BaseModel, Field


class CrossingRunRequest(BaseModel):
    dataset_ids: list[str] = Field(..., min_length=2, description="Identifiants de jeux de données du catalogue à croiser (2 ou plus)")
    measures: dict[str, str] = Field(default_factory=dict, description="Mesure choisie par dataset_id ; mesure par défaut si omise")
    dimension: str | None = Field(default=None, description="Dimension de croisement (ex: 'region', 'year') ; auto-détectée si omise")
    year: int | None = Field(default=None, description="Année à laquelle filtrer les jeux de données ayant une dimension 'year' (hors dimension de croisement) ; année la plus récente si omise")
    explain: bool = Field(default=False, description="Reformuler la phrase d'interprétation via Claude (les chiffres restent calculés par le moteur)")


class DatasetRef(BaseModel):
    dataset_id: str
    label: str
    measure_column: str
    measure_label: str
    unit: str
    source: str
    year: int | None


class IndicatorPoint(BaseModel):
    zone: str
    value: float


class CrossingIndicator(BaseModel):
    recipe_slug: str | None
    label: str
    unit: str
    numerator_dataset: str
    denominator_dataset: str
    points: list[IndicatorPoint]


class PairCorrelation(BaseModel):
    dataset_a: str
    dataset_b: str
    r: float | None
    n: int


class CrossingRunResponse(BaseModel):
    dataset_ids: list[str]
    dimension: str
    year: int | None
    datasets: list[DatasetRef]
    joined_table: dict[str, dict[str, float]]
    indicators: list[CrossingIndicator]
    correlations: list[PairCorrelation]
    interpretation: str
    sources: list[str]


class CompatibleEntry(BaseModel):
    dataset_id: str
    label: str
    shared_dimensions: list[str]


class CrossingCompatibleResponse(BaseModel):
    dataset_id: str
    compatible: list[CompatibleEntry]
