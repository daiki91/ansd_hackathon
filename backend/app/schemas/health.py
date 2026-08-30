import math

from pydantic import BaseModel, ConfigDict, field_validator


class HealthEstablishmentOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    region: str
    facility_type: str
    count: float | None
    year: int
    source: str

    @field_validator("count", mode="before")
    @classmethod
    def _nan_to_none(cls, v):
        if isinstance(v, float) and math.isnan(v):
            return None
        return v
