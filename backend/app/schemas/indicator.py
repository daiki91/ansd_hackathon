import math

from pydantic import BaseModel, ConfigDict, field_validator


class IndicatorOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    category: str
    indicator: str
    value: float | None
    unit: str
    year: int
    source: str

    @field_validator("value", mode="before")
    @classmethod
    def _nan_to_none(cls, v):
        """Un NaN stocke en base (valeur numerique manquante non nettoyee a
        l'ingestion) ferait planter la serialisation JSON (Starlette refuse
        NaN, voir RFC JSON). On le convertit en None -> `null` en JSON."""
        if isinstance(v, float) and math.isnan(v):
            return None
        return v
