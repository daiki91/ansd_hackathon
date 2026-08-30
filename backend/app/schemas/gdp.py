import math

from pydantic import BaseModel, ConfigDict, field_validator


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

    @field_validator(
        "pib_volume_mds",
        "pib_valeur_mds",
        "part_primaire_pct",
        "part_secondaire_pct",
        "part_tertiaire_pct",
        mode="before",
    )
    @classmethod
    def _nan_to_none(cls, v):
        if isinstance(v, float) and math.isnan(v):
            return None
        return v
