import math

from pydantic import BaseModel, ConfigDict, field_validator


class PopulationOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    region: str
    count: float
    share_pct: float | None
    year: int
    source: str

    @field_validator("share_pct", mode="before")
    @classmethod
    def _nan_to_none(cls, v):
        if isinstance(v, float) and math.isnan(v):
            return None
        return v
