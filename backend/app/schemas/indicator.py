from pydantic import BaseModel, ConfigDict


class IndicatorOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    category: str
    indicator: str
    value: float
    unit: str
    year: int
    source: str
