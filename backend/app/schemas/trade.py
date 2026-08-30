import math

from pydantic import BaseModel, ConfigDict, field_validator


class TradeFlowOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    year: int
    flow_type: str
    country: str
    share_pct: float | None
    value_fcfa_billions: float | None
    source: str

    @field_validator("share_pct", "value_fcfa_billions", mode="before")
    @classmethod
    def _nan_to_none(cls, v):
        if isinstance(v, float) and math.isnan(v):
            return None
        return v
