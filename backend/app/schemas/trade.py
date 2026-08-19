from pydantic import BaseModel, ConfigDict


class TradeFlowOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    year: int
    flow_type: str
    country: str
    share_pct: float | None
    value_fcfa_billions: float | None
    source: str
