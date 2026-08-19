from pydantic import BaseModel, ConfigDict


class HealthEstablishmentOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    region: str
    facility_type: str
    count: float
    year: int
    source: str
