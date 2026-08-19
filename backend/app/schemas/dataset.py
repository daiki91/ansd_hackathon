from datetime import datetime

from pydantic import BaseModel, ConfigDict


class DatasetOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    title: str
    description: str
    domain: str
    source_name: str
    source_url: str
    period_covered: str
    geographic_level: str
    variables: list[str]
    compatible_dataset_ids: list[str]
    retrieved_at: datetime

    @classmethod
    def from_orm_model(cls, model) -> "DatasetOut":
        return cls(
            id=model.id,
            title=model.title,
            description=model.description,
            domain=model.domain,
            source_name=model.source_name,
            source_url=model.source_url,
            period_covered=model.period_covered,
            geographic_level=model.geographic_level,
            variables=[v.strip() for v in model.variables.split(",") if v.strip()],
            compatible_dataset_ids=[
                v.strip() for v in model.compatible_dataset_ids.split(",") if v.strip()
            ],
            retrieved_at=model.retrieved_at,
        )
