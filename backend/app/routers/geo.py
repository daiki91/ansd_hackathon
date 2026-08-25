"""Endpoints pour les données géographiques et les sources de données."""

from fastapi import APIRouter

router = APIRouter(prefix="/api/v1/geo", tags=["geo"])


# Coordonnées des 14 régions du Sénégal (centre approximatif)
REGIONS = [
    {"name": "Dakar", "center": [-17.4677, 14.7167], "code": "DK"},
    {"name": "Diourbel", "center": [-16.2351, 14.6561], "code": "DB"},
    {"name": "Fatick", "center": [-16.4025, 14.3394], "code": "FK"},
    {"name": "Kaffrine", "center": [-15.5519, 14.1063], "code": "KF"},
    {"name": "Kaolack", "center": [-16.0731, 14.1518], "code": "KL"},
    {"name": "Kédougou", "center": [-12.1747, 12.5571], "code": "KE"},
    {"name": "Kolda", "center": [-14.9413, 12.8944], "code": "KO"},
    {"name": "Louga", "center": [-16.2271, 15.6184], "code": "LG"},
    {"name": "Matam", "center": [-13.2553, 15.6561], "code": "MT"},
    {"name": "Saint-Louis", "center": [-16.4803, 16.0326], "code": "SL"},
    {"name": "Sédhiou", "center": [-15.5564, 12.7081], "code": "SE"},
    {"name": "Tambacounda", "center": [-13.6673, 13.7709], "code": "TC"},
    {"name": "Thiès", "center": [-16.9266, 14.7886], "code": "TH"},
    {"name": "Ziguinchor", "center": [-16.2722, 12.5644], "code": "ZG"},
]

# 45 départements du Sénégal
DEPARTMENTS = [
    {"name": "Dakar", "region": "Dakar", "center": [-17.4439, 14.6928]},
    {"name": "Guédiawaye", "region": "Dakar", "center": [-17.4194, 14.7772]},
    {"name": "Pikine", "region": "Dakar", "center": [-17.4333, 14.7500]},
    {"name": "Rufisque", "region": "Dakar", "center": [-17.2167, 14.7167]},
    {"name": "Diourbel", "region": "Diourbel", "center": [-16.2351, 14.6561]},
    {"name": "Mbacké", "region": "Diourbel", "center": [-15.9167, 14.8000]},
    {"name": "Bambey", "region": "Diourbel", "center": [-16.3333, 14.5333]},
    {"name": "Fatick", "region": "Fatick", "center": [-16.4025, 14.3394]},
    {"name": "Foundiougne", "region": "Fatick", "center": [-16.4667, 14.4167]},
    {"name": "Sokone", "region": "Fatick", "center": [-16.4833, 14.2833]},
    {"name": "Kaffrine", "region": "Kaffrine", "center": [-15.5519, 14.1063]},
    {"name": "Malem Hodar", "region": "Kaffrine", "center": [-15.4333, 14.1833]},
    {"name": "Koungheul", "region": "Kaffrine", "center": [-15.3500, 14.0333]},
    {"name": "Rémyca", "region": "Kaffrine", "center": [-15.6167, 14.0667]},
    {"name": "Kaolack", "region": "Kaolack", "center": [-16.0731, 14.1518]},
    {"name": "Guinguio", "region": "Kaolack", "center": [-15.8500, 14.2333]},
    {"name": "Ndangane", "region": "Kaolack", "center": [-15.9333, 14.0833]},
    {"name": "Kolda", "region": "Kolda", "center": [-14.9413, 12.8944]},
    {"name": "Médina Yoro Foulah", "region": "Kolda", "center": [-14.8167, 13.1500]},
    {"name": "Vélingara", "region": "Kolda", "center": [-14.5667, 12.7167]},
    {"name": "Kédougou", "region": "Kédougou", "center": [-12.1747, 12.5571]},
    {"name": "Salémata", "region": "Kédougou", "center": [-12.3333, 12.6333]},
    {"name": "Saraya", "region": "Kédougou", "center": [-12.4833, 12.4833]},
    {"name": "Louga", "region": "Louga", "center": [-16.2271, 15.6184]},
    {"name": "Kébémer", "region": "Louga", "center": [-16.3167, 15.5333]},
    {"name": "Linguère", "region": "Louga", "center": [-16.0833, 15.4167]},
    {"name": "Matam", "region": "Matam", "center": [-13.2553, 15.6561]},
    {"name": "Kanel", "region": "Matam", "center": [-13.1167, 15.5667]},
    {"name": "Ranérou", "region": "Matam", "center": [-13.6333, 15.7167]},
    {"name": "Saint-Louis", "region": "Saint-Louis", "center": [-16.4803, 16.0326]},
    {"name": "Podor", "region": "Saint-Louis", "center": [-16.1333, 16.3667]},
    {"name": "Dagana", "region": "Saint-Louis", "center": [-16.0000, 16.2500]},
    {"name": "Sédhiou", "region": "Sédhiou", "center": [-15.5564, 12.7081]},
    {"name": "Bignona", "region": "Sédhiou", "center": [-15.5333, 12.8333]},
    {"name": "Oussouye", "region": "Sédhiou", "center": [-15.7167, 12.5333]},
    {"name": "Tambacounda", "region": "Tambacounda", "center": [-13.6673, 13.7709]},
    {"name": "Bakel", "region": "Tambacounda", "center": [-13.8167, 13.8500]},
    {"name": "Goudiry", "region": "Tambacounda", "center": [-13.4167, 13.9833]},
    {"name": "Koumpentoum", "region": "Tambacounda", "center": [-13.9667, 13.6833]},
    {"name": "Thiès", "region": "Thiès", "center": [-16.9266, 14.7886]},
    {"name": "M'Bayar", "region": "Thiès", "center": [-16.9667, 14.8500]},
    {"name": "Mékhe", "region": "Thiès", "center": [-16.8667, 15.0167]},
    {"name": "Tivaouane", "region": "Thiès", "center": [-16.8167, 14.9500]},
    {"name": "Joal-Fadiouth", "region": "Thiès", "center": [-16.8167, 14.4833]},
    {"name": "Ziguinchor", "region": "Ziguinchor", "center": [-16.2722, 12.5644]},
]

# Sources de données officielles
DATA_SOURCES = [
    {
        "id": "ansd",
        "name": "ANSD",
        "full_name": "Agence Nationale de la Statistique et de la Démographie",
        "url": "https://www.ansd.sn",
        "description": "Source officielle des statistiques nationales du Sénégal",
        "type": "primary",
        "datasets_available": ["population", "indicateurs", "sante", "commerce"],
    },
    {
        "id": "opendata",
        "name": "Open Data Sénégal",
        "full_name": "Portail Open Data du Sénégal",
        "url": "https://www.data.sn",
        "description": "Plateforme de données ouvertes du gouvernement sénégalais",
        "type": "open_data",
        "datasets_available": ["tous_domaines"],
    },
    {
        "id": "anads",
        "name": "ANADS",
        "full_name": "Agence Nationale de la Statistique et de la Démographie (Délégation)",
        "url": "https://anads.ansd.sn",
        "description": "Données statistiques décentralisées et locale",
        "type": "decentralized",
        "datasets_available": ["regions", "communes", "departements"],
    },
    {
        "id": "stats_sn",
        "name": "Stats Sénégal",
        "full_name": "Portail statistique du Sénégal",
        "url": "https://stats.sn",
        "description": "Indicateurs et tableaux de bord statistiques",
        "type": "dashboard",
        "datasets_available": ["indicateurs", "tableaux_de_bord"],
    },
    {
        "id": "open_data_for_africa",
        "name": "Open Data for Africa",
        "full_name": "Open Data for Africa (ANSD)",
        "url": "https://senegal.opendataforafrica.org",
        "description": "Données ouvertes ANSD au format standardisé",
        "type": "open_data",
        "datasets_available": ["sante", "education", "population"],
    },
]


@router.get("/regions")
def get_regions():
    """Liste des 14 régions avec coordonnées."""
    return {"regions": REGIONS, "count": len(REGIONS)}


@router.get("/departments")
def get_departments(region: str | None = None):
    """Liste des départements, optionnellement filtrés par région."""
    deps = DEPARTMENTS
    if region:
        deps = [d for d in deps if d["region"].lower() == region.lower()]
    return {"departments": deps, "count": len(deps)}


@router.get("/sources")
def get_data_sources():
    """Sources de données officielles disponibles."""
    return {"sources": DATA_SOURCES, "count": len(DATA_SOURCES)}
