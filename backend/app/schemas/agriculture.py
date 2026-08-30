from pydantic import BaseModel, ConfigDict


class AgricultureProductionOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    year: int
    production_nette_tonnes: float
    source: str


class CerealImportsOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    year: int
    import_tonnes: float
    source: str
