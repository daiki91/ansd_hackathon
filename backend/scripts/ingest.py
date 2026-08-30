"""Script d'ingestion des données brutes (data/raw/*.csv) vers la base de
données de l'application.

Usage :
    python -m scripts.ingest

Ce script :
  1. crée les tables si elles n'existent pas encore ;
  2. vide puis recharge les tables de données depuis les CSV de data/raw/ ;
  3. peuple/actualise le catalogue de jeux de données (table `datasets`),
     utilisé par les endpoints /api/v1/catalog/*.

Il est conçu pour être ré-exécuté à volonté (idempotent) et pour accueillir,
sans changement de code, les exports officiels ANSD une fois récupérés
manuellement depuis Open Data for Africa (voir README.md) : il suffit de
remplacer/compléter les fichiers CSV dans data/raw/ en conservant les mêmes
colonnes.
"""

import sys
from pathlib import Path

import pandas as pd

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from app.db.base import Base  # noqa: E402
from app.db.session import SessionLocal, engine  # noqa: E402
from app.models.dataset import Dataset  # noqa: E402
from app.models.gdp import RegionalGdp  # noqa: E402
from app.models.health import HealthEstablishment  # noqa: E402
from app.models.indicator import Indicator  # noqa: E402
from app.models.population import Population  # noqa: E402
from app.models.trade import TradeFlow  # noqa: E402

DATA_DIR = Path(__file__).resolve().parent.parent / "data" / "raw"

DATASETS_CATALOG = [
    Dataset(
        id="etablissements-sante",
        title="Établissements de santé du Sénégal",
        description=(
            "Nombre d'établissements de santé (hôpitaux, centres de santé, "
            "postes de santé, cases de santé, districts sanitaires) par "
            "région et par année."
        ),
        domain="Santé",
        source_name="ANSD / Ministère de la Santé et de l'Action Sociale (MSAS)",
        source_url="https://senegal.opendataforafrica.org/hfhored/etablissements-de-sante",
        period_covered="2017, 2022 (données d'amorçage -- à étendre)",
        geographic_level="National, Région",
        variables="region,facility_type,count,year",
        compatible_dataset_ids="",
        table_name="health_establishments",
    ),
    Dataset(
        id="commerce-exterieur",
        title="Exportations et importations du Sénégal par pays",
        description=(
            "Valeurs et parts des principaux pays partenaires du Sénégal à "
            "l'export et à l'import."
        ),
        domain="Commerce extérieur",
        source_name="ANSD (Note d'Analyse du Commerce Extérieur)",
        source_url="https://senegal.opendataforafrica.org/obvklwd/exportations-et-importations-par-pays",
        period_covered="2023 (données d'amorçage -- à étendre)",
        geographic_level="National, Pays partenaire",
        variables="year,flow_type,country,share_pct,value_fcfa_billions",
        compatible_dataset_ids="",
        table_name="trade_flows",
    ),
    Dataset(
        id="population",
        title="Population résidente du Sénégal par région",
        description=(
            "Population totale nationale et principales régions (RGPH-5, "
            "2023) -- jeu de données transversal, base de croisement avec "
            "les autres domaines (santé, éducation, emploi, agriculture)."
        ),
        domain="Population",
        source_name="ANSD (5e Recensement Général de la Population et de l'Habitat -- RGPH-5)",
        source_url="https://www.ansd.sn/enquete-et-etude/recensement-general-de-la-population-et-de-lhabitat-rgph-5-2023",
        period_covered="2023 (données d'amorçage -- à étendre aux 14 régions)",
        geographic_level="National, Région (partiel)",
        variables="region,count,share_pct,year",
        compatible_dataset_ids="etablissements-sante,commerce-exterieur",
        table_name="population",
    ),
    Dataset(
        id="indicateurs-nationaux",
        title="Indicateurs nationaux dynamiques (Économie, Population)",
        description=(
            "Indicateurs économiques (croissance du PIB, inflation, dette "
            "publique) et démographiques (croissance, urbanisation, "
            "espérance de vie) suivis dans le temps."
        ),
        domain="Économie",
        source_name="ANSD / Direction générale du Trésor (France)",
        source_url="https://www.tresor.economie.gouv.fr/Pays/SN/situation-economique-et-financiere-du-senegal",
        period_covered="2020-2024 (données d'amorçage -- à étendre)",
        geographic_level="National",
        variables="category,indicator,value,unit,year",
        compatible_dataset_ids="population",
        table_name="indicators",
    ),
]


def ingest_health_establishments(session) -> int:
    df = pd.read_csv(DATA_DIR / "etablissements_sante.csv", comment="#")
    df = df.astype(object).where(df.notna(), None)
    session.query(HealthEstablishment).delete()
    rows = [HealthEstablishment(**record) for record in df.to_dict(orient="records")]
    session.add_all(rows)
    return len(rows)


def ingest_trade_flows(session) -> int:
    df = pd.read_csv(DATA_DIR / "commerce_exterieur.csv", comment="#")
    df = df.astype(object).where(df.notna(), None)
    session.query(TradeFlow).delete()
    rows = [TradeFlow(**record) for record in df.to_dict(orient="records")]
    session.add_all(rows)
    return len(rows)


def ingest_population(session) -> int:
    df = pd.read_csv(DATA_DIR / "population.csv", comment="#")
    df = df.astype(object).where(df.notna(), None)
    session.query(Population).delete()
    rows = [Population(**record) for record in df.to_dict(orient="records")]
    session.add_all(rows)
    return len(rows)


def ingest_indicators(session) -> int:
    df = pd.read_csv(DATA_DIR / "indicateurs_nationaux.csv", comment="#")
    df = df.astype(object).where(df.notna(), None)
    session.query(Indicator).delete()
    rows = [Indicator(**record) for record in df.to_dict(orient="records")]
    session.add_all(rows)
    return len(rows)


def ingest_regional_gdp(session) -> int:
    df = pd.read_csv(DATA_DIR / "regional_gdp.csv", comment="#")
    df = df.astype(object).where(df.notna(), None)
    session.query(RegionalGdp).delete()
    rows = [RegionalGdp(**record) for record in df.to_dict(orient="records")]
    session.add_all(rows)
    return len(rows)


def ingest_catalog(session) -> int:
    for dataset in DATASETS_CATALOG:
        session.merge(dataset)
    return len(DATASETS_CATALOG)


def main() -> None:
    Base.metadata.create_all(bind=engine)
    session = SessionLocal()
    try:
        n_health = ingest_health_establishments(session)
        n_trade = ingest_trade_flows(session)
        n_population = ingest_population(session)
        n_indicators = ingest_indicators(session)
        n_gdp = ingest_regional_gdp(session)
        n_catalog = ingest_catalog(session)
        session.commit()
        print(f"Ingestion terminée : {n_health} lignes santé, {n_trade} lignes commerce, "
              f"{n_population} lignes population, {n_indicators} lignes indicateurs, "
              f"{n_gdp} lignes PIB régional, "
              f"{n_catalog} jeux de données catalogués.")
    except Exception:
        session.rollback()
        raise
    finally:
        session.close()


if __name__ == "__main__":
    main()
