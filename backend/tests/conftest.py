import sys
from pathlib import Path

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from app.db.base import Base  # noqa: E402
from app.db.session import get_db  # noqa: E402
from app.main import app  # noqa: E402
from app.models.dataset import Dataset  # noqa: E402
from app.models.health import HealthEstablishment  # noqa: E402
from app.models.indicator import Indicator  # noqa: E402
from app.models.population import Population  # noqa: E402
from app.models.trade import TradeFlow  # noqa: E402

TEST_ENGINE = create_engine(
    "sqlite:///:memory:",
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=TEST_ENGINE)


@pytest.fixture()
def client():
    Base.metadata.create_all(bind=TEST_ENGINE)
    session = TestSessionLocal()

    session.add(
        Dataset(
            id="etablissements-sante",
            title="Établissements de santé du Sénégal",
            description="Jeu de test",
            domain="Santé",
            source_name="ANSD",
            source_url="https://example.org",
            period_covered="2022",
            geographic_level="National",
            variables="region,facility_type,count,year",
            compatible_dataset_ids="",
            table_name="health_establishments",
        )
    )
    session.add(
        HealthEstablishment(
            region="National", facility_type="Centre de santé", count=114, year=2022, source="ANSD"
        )
    )
    session.add(
        TradeFlow(year=2023, flow_type="export", country="Mali", share_pct=23.0,
                   value_fcfa_billions=741.5, source="ANSD")
    )
    session.add(
        Population(region="National", count=18126390, share_pct=None, year=2023, source="ANSD (RGPH-5)")
    )
    session.add(
        Indicator(category="Économie", indicator="Croissance du PIB", value=4.5, unit="%",
                  year=2024, source="DG Trésor")
    )
    session.commit()
    session.close()

    def override_get_db():
        db = TestSessionLocal()
        try:
            yield db
        finally:
            db.close()

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as test_client:
        yield test_client

    app.dependency_overrides.clear()
    Base.metadata.drop_all(bind=TEST_ENGINE)
