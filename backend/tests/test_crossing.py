"""Tests du moteur de croisement (RF-18 à RF-21).

Utilise une base SQLite en mémoire dédiée (fixture `crossing_db`), distincte
de celle de tests/conftest.py, pour pouvoir peupler plusieurs régions/années
sans perturber les tests existants de test_api.py (qui attendent un
catalogue minimal à une seule entrée).
"""

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.db.base import Base
from app.db.session import get_db
from app.main import app
from app.models.agriculture import AgricultureProduction, CerealImports
from app.models.gdp import RegionalGdp
from app.models.geography import RegionArea
from app.models.health import HealthEstablishment
from app.models.population import Population
from app.models.trade import TradeFlow
from app.services.crossing.adapters import detect_common_dimensions
from app.services.crossing.recipes import find_recipe

CROSSING_ENGINE = create_engine(
    "sqlite:///:memory:",
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
CrossingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=CROSSING_ENGINE)

REGIONS = [
    ("Dakar", 4_004_425, 550, 55),
    ("Thiès", 2_463_679, 6_670, 30),
    ("Diourbel", 2_080_332, 4_824, 20),
    ("Kaolack", 1_336_718, 5_357, 15),
]


@pytest.fixture()
def crossing_client():
    Base.metadata.create_all(bind=CROSSING_ENGINE)
    session = CrossingSessionLocal()

    for region, pop, area, facilities in REGIONS:
        session.add(Population(region=region, count=pop, share_pct=None, year=2023, source="ANSD (RGPH-5)"))
        session.add(RegionArea(region=region, area_km2=area, source="Test"))
        session.add(HealthEstablishment(region=region, facility_type="Centre de santé", count=facilities, year=2022, source="ANSD"))
        session.add(RegionalGdp(region=region, year=2023, pib_volume_mds=pop / 1000, pib_valeur_mds=pop / 900,
                                 part_primaire_pct=10.0, part_secondaire_pct=20.0, part_tertiaire_pct=70.0))

    session.add(TradeFlow(year=2023, flow_type="import", country="France", share_pct=10.0, value_fcfa_billions=100.0, source="ANSD"))

    for year, production in [(2019, 900_000.0), (2020, 950_000.0), (2021, 1_000_000.0), (2022, 1_050_000.0)]:
        session.add(AgricultureProduction(year=year, production_nette_tonnes=production, source="Test"))
    for year, imports in [(2019, 600_000.0), (2020, 650_000.0), (2021, 500_000.0), (2022, 700_000.0)]:
        session.add(CerealImports(year=year, import_tonnes=imports, source="Test"))

    session.commit()
    session.close()

    def override_get_db():
        db = CrossingSessionLocal()
        try:
            yield db
        finally:
            db.close()

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as test_client:
        yield test_client

    app.dependency_overrides.clear()
    Base.metadata.drop_all(bind=CROSSING_ENGINE)


# ── Détection de dimensions communes (RF-18) ─────────────────────────────

def test_detect_common_dimensions_region_and_year():
    assert detect_common_dimensions(["population", "etablissements-sante"]) == ["region", "year"]


def test_detect_common_dimensions_region_only():
    assert detect_common_dimensions(["population", "superficie-regions"]) == ["region"]


def test_detect_common_dimensions_year_only():
    assert detect_common_dimensions(["production-agricole-cereales", "importations-cereales"]) == ["year"]


def test_detect_common_dimensions_none():
    assert detect_common_dimensions(["superficie-regions", "indicateurs-nationaux"]) == []


# ── Couche sémantique (la demande initiale de l'utilisateur) ─────────────

def test_find_recipe_population_area_gives_density():
    match = find_recipe("population_count", "area_km2")
    assert match is not None
    recipe, swapped = match
    assert recipe.slug == "densite_population"
    assert swapped is False  # population déjà au numérateur


def test_find_recipe_reverse_order_still_found_and_flagged_swapped():
    match = find_recipe("area_km2", "population_count")
    assert match is not None
    recipe, swapped = match
    assert recipe.slug == "densite_population"
    assert swapped is True


def test_find_recipe_unknown_pair_returns_none():
    assert find_recipe("trade_value", "generic_value") is None


# ── API /crossing/run ─────────────────────────────────────────────────────

def test_crossing_density_is_named_not_generic_ratio(crossing_client):
    resp = crossing_client.post("/api/v1/crossing/run", json={"dataset_ids": ["population", "superficie-regions"]})
    assert resp.status_code == 200
    body = resp.json()
    assert body["dimension"] == "region"
    indicator = body["indicators"][0]
    assert indicator["recipe_slug"] == "densite_population"
    assert indicator["label"] == "Densité de population"
    assert indicator["unit"] == "hab./km²"
    top = indicator["points"][0]
    assert top["zone"] == "Dakar"  # Dakar : 4 004 425 hab. / 550 km² = la densité la plus forte


def test_crossing_health_reproduces_demo_case_1(crossing_client):
    resp = crossing_client.post("/api/v1/crossing/run", json={"dataset_ids": ["population", "etablissements-sante"]})
    assert resp.status_code == 200
    body = resp.json()
    indicator = body["indicators"][0]
    assert indicator["recipe_slug"] == "population_par_etablissement"
    zones = {p["zone"] for p in indicator["points"]}
    assert zones == {"Dakar", "Thiès", "Diourbel", "Kaolack"}


def test_crossing_agriculture_temporal_dependency_ratio(crossing_client):
    resp = crossing_client.post("/api/v1/crossing/run", json={
        "dataset_ids": ["production-agricole-cereales", "importations-cereales"],
    })
    assert resp.status_code == 200
    body = resp.json()
    assert body["dimension"] == "year"
    indicator = body["indicators"][0]
    assert indicator["recipe_slug"] == "dependance_importations_cereales"
    assert indicator["unit"] == "%"
    assert len(indicator["points"]) == 4  # 2019-2022
    for point in indicator["points"]:
        assert 0 <= point["value"] <= 100
    assert len(body["correlations"]) == 1
    assert body["correlations"][0]["n"] == 4


def test_crossing_unknown_dataset_returns_404(crossing_client):
    resp = crossing_client.post("/api/v1/crossing/run", json={"dataset_ids": ["population", "does-not-exist"]})
    assert resp.status_code == 404


def test_crossing_unknown_measure_returns_422(crossing_client):
    resp = crossing_client.post("/api/v1/crossing/run", json={
        "dataset_ids": ["population", "etablissements-sante"],
        "measures": {"population": "not_a_real_column"},
    })
    assert resp.status_code == 422


def test_crossing_no_common_dimension_returns_422(crossing_client):
    resp = crossing_client.post("/api/v1/crossing/run", json={"dataset_ids": ["superficie-regions", "indicateurs-nationaux"]})
    assert resp.status_code == 422


def test_crossing_requires_at_least_two_datasets(crossing_client):
    resp = crossing_client.post("/api/v1/crossing/run", json={"dataset_ids": ["population"]})
    assert resp.status_code == 422


def test_crossing_compatible_endpoint(crossing_client):
    resp = crossing_client.get("/api/v1/crossing/compatible", params={"dataset_id": "population"})
    assert resp.status_code == 200
    body = resp.json()
    compatible_ids = {c["dataset_id"] for c in body["compatible"]}
    assert "etablissements-sante" in compatible_ids
    assert "superficie-regions" in compatible_ids
