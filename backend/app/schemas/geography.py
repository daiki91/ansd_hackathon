from pydantic import BaseModel, ConfigDict


class RegionAreaOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    region: str
    area_km2: float
    source: str
