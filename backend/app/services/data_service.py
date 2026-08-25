"""Service de données en temps réel pour DATA LINK.

Principe :
  - Les données sont fetchées depuis les sources officielles (ANSD, Open Data
    Sénégal, Open Data for Africa) à chaque refresh
  - Le RGPH-5 (2023) est la dernière base de recensement, projections 2023-2073
    utilisées jusqu'au prochain recensement
  - Même principe pour santé, indicateurs, commerce : toujours la source la
    plus récente disponible
  - Si le fetch échoue, fallback sur les CSV locaux (data/raw/)
"""

import csv
import io
import json
import logging
import urllib.request
import urllib.error
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

logger = logging.getLogger(__name__)

DATA_DIR = Path(__file__).resolve().parent.parent.parent / "data" / "raw"

# ── Data freshness tracking ──────────────────────────────────────────
_freshness: dict[str, dict[str, Any]] = {}


def _now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def _fetch_url(url: str, timeout: int = 15) -> str | None:
    """Fetch URL content with timeout, returns None on failure."""
    try:
        req = urllib.request.Request(url, headers={"User-Agent": "DataLink/1.0"})
        with urllib.request.urlopen(req, timeout=timeout) as resp:
            return resp.read().decode("utf-8")
    except (urllib.error.URLError, OSError, TimeoutError) as e:
        logger.warning("Fetch failed for %s: %s", url, e)
        return None


def _load_local_csv(filename: str) -> list[dict]:
    """Load CSV from data/raw/ directory, skipping comment lines."""
    filepath = DATA_DIR / filename
    if not filepath.exists():
        return []
    rows = []
    with open(filepath, "r", encoding="utf-8") as f:
        for line in f:
            if line.startswith("#"):
                continue
            rows.append(line)
    reader = csv.DictReader(io.StringIO("".join(rows)))
    return list(reader)


# ── Official source URLs ──────────────────────────────────────────────
SOURCES = {
    "opendata_senegal_ckan": {
        "name": "Open Data Sénégal",
        "base_url": "https://data.sn/api/3/action",
        " datasets": [
            "population", "sante", "indicateurs"
        ],
    },
    "ansd": {
        "name": "ANSD (Agence Nationale de la Statistique)",
        "base_url": "https://www.ansd.sn",
    },
    "opendata_africa": {
        "name": "Open Data for Africa (ANSD)",
        "base_url": "https://senegal.opendataforafrica.org",
    },
}


# ── Population (RGPH-5 + projections) ────────────────────────────────
def fetch_population() -> dict[str, Any]:
    """Fetch population data from official sources.

    Stratégie :
      1. Essayer Open Data Sénégal (CKAN API) pour le dataset population
      2. Si échec, utiliser le CSV local (data/raw/population.csv)
      3. Les projections 2023-2073 sont dans le CSV (extraites du PDF ANSD)
    """
    # Try Open Data Sénégal CKAN
    ckan_url = "https://data.sn/api/3/action/package_show?id=population-residente"
    raw = _fetch_url(ckan_url)
    if raw:
        try:
            data = json.loads(raw)
            if data.get("success"):
                resources = data["result"].get("resources", [])
                for res in resources:
                    if res.get("format", "").upper() == "CSV":
                        csv_url = res.get("url")
                        if csv_url:
                            csv_content = _fetch_url(csv_url)
                            if csv_content:
                                reader = csv.DictReader(io.StringIO(csv_content))
                                rows = list(reader)
                                if rows:
                                    _freshness["population"] = {
                                        "source": "Open Data Sénégal (CKAN)",
                                        "url": ckan_url,
                                        "fetched_at": _now_iso(),
                                        "rows": len(rows),
                                        "status": "live",
                                    }
                                    return {"data": rows, "source": "opendata_senegal"}
        except (json.JSONDecodeError, KeyError):
            pass

    # Fallback: local CSV (projections ANSD RGPH-5)
    rows = _load_local_csv("population.csv")
    _freshness["population"] = {
        "source": "ANSD RGPH-5 (CSV local — projections 2023-2073)",
        "url": "data/raw/population.csv",
        "fetched_at": _now_iso(),
        "rows": len(rows),
        "status": "local_cache",
    }
    return {"data": rows, "source": "local_csv"}


# ── Santé (établissements) ───────────────────────────────────────────
def fetch_health() -> dict[str, Any]:
    """Fetch health establishments from official sources.

    Stratégie :
      1. Open Data for Africa — dataset établissements de santé ANSD
      2. Fallback CSV local
    """
    # Try Open Data for Africa
    oda_url = "https://senegal.opendataforafrica.org/api/3/action/package_show?id=etablissements-de-sante"
    raw = _fetch_url(oda_url)
    if raw:
        try:
            data = json.loads(raw)
            if data.get("success"):
                resources = data["result"].get("resources", [])
                for res in resources:
                    if res.get("format", "").upper() == "CSV":
                        csv_url = res.get("url")
                        if csv_url:
                            csv_content = _fetch_url(csv_url)
                            if csv_content:
                                reader = csv.DictReader(io.StringIO(csv_content))
                                rows = list(reader)
                                if rows:
                                    _freshness["health"] = {
                                        "source": "Open Data for Africa (ANSD)",
                                        "url": oda_url,
                                        "fetched_at": _now_iso(),
                                        "rows": len(rows),
                                        "status": "live",
                                    }
                                    return {"data": rows, "source": "opendata_africa"}
        except (json.JSONDecodeError, KeyError):
            pass

    rows = _load_local_csv("etablissements_sante.csv")
    _freshness["health"] = {
        "source": "ANSD/MSAS (CSV local — données 2017-2022)",
        "url": "data/raw/etablissements_sante.csv",
        "fetched_at": _now_iso(),
        "rows": len(rows),
        "status": "local_cache",
    }
    return {"data": rows, "source": "local_csv"}


# ── Indicateurs nationaux ────────────────────────────────────────────
def fetch_indicators() -> dict[str, Any]:
    """Fetch national indicators from official sources.

    Stratégie :
      1. Open Data Sénégal CKAN — indicateurs économiques
      2. Fallback CSV local
    """
    ckan_url = "https://data.sn/api/3/action/package_search?q=indicateurs+economie&rows=5"
    raw = _fetch_url(ckan_url)
    if raw:
        try:
            data = json.loads(raw)
            if data.get("success"):
                results = data["result"].get("results", [])
                for pkg in results:
                    for res in pkg.get("resources", []):
                        if res.get("format", "").upper() == "CSV":
                            csv_url = res.get("url")
                            if csv_url:
                                csv_content = _fetch_url(csv_url)
                                if csv_content:
                                    reader = csv.DictReader(io.StringIO(csv_content))
                                    rows = list(reader)
                                    if rows:
                                        _freshness["indicators"] = {
                                            "source": "Open Data Sénégal (CKAN)",
                                            "url": ckan_url,
                                            "fetched_at": _now_iso(),
                                            "rows": len(rows),
                                            "status": "live",
                                        }
                                        return {"data": rows, "source": "opendata_senegal"}
        except (json.JSONDecodeError, KeyError):
            pass

    rows = _load_local_csv("indicateurs_nationaux.csv")
    _freshness["indicators"] = {
        "source": "ANSD/DG Trésor (CSV local — données 2020-2024)",
        "url": "data/raw/indicateurs_nationaux.csv",
        "fetched_at": _now_iso(),
        "rows": len(rows),
        "status": "local_cache",
    }
    return {"data": rows, "source": "local_csv"}


# ── Commerce extérieur ───────────────────────────────────────────────
def fetch_trade() -> dict[str, Any]:
    """Fetch trade data from official sources."""
    rows = _load_local_csv("commerce_exterieur.csv")
    _freshness["trade"] = {
        "source": "ANSD Note d'Analyse du Commerce Extérieur (CSV local)",
        "url": "data/raw/commerce_exterieur.csv",
        "fetched_at": _now_iso(),
        "rows": len(rows),
        "status": "local_cache",
    }
    return {"data": rows, "source": "local_csv"}


# ── Refresh all ──────────────────────────────────────────────────────
def refresh_all() -> dict[str, Any]:
    """Refresh all data from official sources with fallback to local CSV.

    Returns summary of what was fetched.
    """
    results = {
        "population": fetch_population(),
        "health": fetch_health(),
        "indicators": fetch_indicators(),
        "trade": fetch_trade(),
        "timestamp": _now_iso(),
    }

    summary = {}
    for domain, result in results.items():
        if domain == "timestamp":
            continue
        summary[domain] = {
            "source": result["source"],
            "rows": len(result["data"]),
            "status": _freshness.get(domain, {}).get("status", "unknown"),
        }

    return {"summary": summary, "freshness": dict(_freshness), "timestamp": results["timestamp"]}


def get_freshness() -> dict[str, Any]:
    """Get current data freshness metadata."""
    return {
        "freshness": dict(_freshness),
        "last_refresh": _freshness.get("_last_refresh", None),
    }


# ── Load projections from CSV ────────────────────────────────────────
def load_projections() -> list[dict]:
    """Load demographic projections 2023-2073 from local CSV."""
    return _load_local_csv("projections_2023_2028.csv")
