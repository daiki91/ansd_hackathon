from pydantic import BaseModel, ConfigDict


class RegionalGdpOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    region: str
    year: int
    pib_volume_mds: float | None
    pib_valeur_mds: float | None
    part_primaire_pct: float | None
    part_secondaire_pct: float | None
    part_tertiaire_pct: float | None
