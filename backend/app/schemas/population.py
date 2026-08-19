from pydantic import BaseModel, ConfigDict


class PopulationOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    region: str
    count: float
    share_pct: float | None
    year: int
    source: str
