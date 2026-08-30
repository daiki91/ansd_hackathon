-- DATA LINK -- schema Postgres pour Supabase
-- Genere a partir des modeles SQLAlchemy dans backend/app/models/.
-- A coller dans Supabase : Project -> SQL Editor -> New query -> Run.
--
-- Note : au demarrage, l'API cree deja ces tables automatiquement
-- (Base.metadata.create_all dans backend/app/main.py) si DATABASE_URL pointe
-- vers Supabase. Ce script sert a preparer le schema a l'avance (ou a le
-- recreer manuellement) sans lancer l'API. Idempotent (IF NOT EXISTS partout).

-- Optionnel : extension PostGIS, prevue par le cahier des charges pour la
-- cartographie interactive (RF-03), pas encore utilisee par le code actuel.
-- CREATE EXTENSION IF NOT EXISTS postgis;

-- Catalogue des jeux de donnees (app/models/dataset.py)
CREATE TABLE IF NOT EXISTS datasets (
    id VARCHAR(64) PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    domain VARCHAR(64) NOT NULL,
    source_name VARCHAR(255) NOT NULL,
    source_url VARCHAR(512) NOT NULL,
    period_covered VARCHAR(128) NOT NULL,
    geographic_level VARCHAR(128) NOT NULL,
    variables TEXT NOT NULL,
    compatible_dataset_ids TEXT NOT NULL,
    table_name VARCHAR(64) NOT NULL,
    retrieved_at TIMESTAMP
);

-- PIB regional (app/models/gdp.py)
CREATE TABLE IF NOT EXISTS regional_gdp (
    id SERIAL PRIMARY KEY,
    region VARCHAR(64) NOT NULL,
    year INTEGER NOT NULL,
    pib_volume_mds DOUBLE PRECISION,
    pib_valeur_mds DOUBLE PRECISION,
    part_primaire_pct DOUBLE PRECISION,
    part_secondaire_pct DOUBLE PRECISION,
    part_tertiaire_pct DOUBLE PRECISION
);
CREATE INDEX IF NOT EXISTS ix_regional_gdp_region ON regional_gdp (region);
CREATE INDEX IF NOT EXISTS ix_regional_gdp_year ON regional_gdp (year);

-- Etablissements de sante (app/models/health.py)
CREATE TABLE IF NOT EXISTS health_establishments (
    id SERIAL PRIMARY KEY,
    region VARCHAR(64) NOT NULL,
    facility_type VARCHAR(64) NOT NULL,
    count DOUBLE PRECISION NOT NULL,
    year INTEGER NOT NULL,
    source VARCHAR(255) NOT NULL
);
CREATE INDEX IF NOT EXISTS ix_health_establishments_region ON health_establishments (region);
CREATE INDEX IF NOT EXISTS ix_health_establishments_facility_type ON health_establishments (facility_type);
CREATE INDEX IF NOT EXISTS ix_health_establishments_year ON health_establishments (year);

-- Indicateurs nationaux (app/models/indicator.py)
CREATE TABLE IF NOT EXISTS indicators (
    id SERIAL PRIMARY KEY,
    category VARCHAR(64) NOT NULL,
    indicator VARCHAR(128) NOT NULL,
    value DOUBLE PRECISION NOT NULL,
    unit VARCHAR(32) NOT NULL,
    year INTEGER NOT NULL,
    source VARCHAR(255) NOT NULL
);
CREATE INDEX IF NOT EXISTS ix_indicators_category ON indicators (category);
CREATE INDEX IF NOT EXISTS ix_indicators_indicator ON indicators (indicator);
CREATE INDEX IF NOT EXISTS ix_indicators_year ON indicators (year);

-- Population par region (app/models/population.py)
CREATE TABLE IF NOT EXISTS population (
    id SERIAL PRIMARY KEY,
    region VARCHAR(64) NOT NULL,
    count DOUBLE PRECISION NOT NULL,
    share_pct DOUBLE PRECISION,
    year INTEGER NOT NULL,
    source VARCHAR(255) NOT NULL
);
CREATE INDEX IF NOT EXISTS ix_population_region ON population (region);
CREATE INDEX IF NOT EXISTS ix_population_year ON population (year);

-- Commerce exterieur (app/models/trade.py)
CREATE TABLE IF NOT EXISTS trade_flows (
    id SERIAL PRIMARY KEY,
    year INTEGER NOT NULL,
    flow_type VARCHAR(16) NOT NULL,
    country VARCHAR(64) NOT NULL,
    share_pct DOUBLE PRECISION,
    value_fcfa_billions DOUBLE PRECISION,
    source VARCHAR(255) NOT NULL
);
CREATE INDEX IF NOT EXISTS ix_trade_flows_year ON trade_flows (year);
CREATE INDEX IF NOT EXISTS ix_trade_flows_flow_type ON trade_flows (flow_type);
CREATE INDEX IF NOT EXISTS ix_trade_flows_country ON trade_flows (country);
