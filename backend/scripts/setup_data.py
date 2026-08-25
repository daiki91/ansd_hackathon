"""Pipeline COMPLET de récupération des données officielles DATA LINK.

Usage :
    python -m scripts.setup_data

Une seule commande pour qu'un nouveau développeur obtienne TOUTES les données :
  1. Catalogue des publications ANSD (scraping ansd.sn, 9 pages)
  2. Téléchargement des ~82 fichiers XLSX officiels dans data/raw/ansd_downloads/
  3. Construction des CSV structurés depuis ces sources officielles :
       - population.csv                (RGPH-5 2023 exact)
       - projections_regions_2023_2050.csv
       - projections_departements_2023_2050.csv
       - etablissements_sante.csv      (DPRS/MSAS tableau F.04.03)
       - regional_gdp.csv              (comptes régionaux 2020-2023)
       - commerce_exterieur.csv        (séries DGIT 2010-2026)
       - indicateurs_nationaux.csv     (inflation IHPC base 2023)
  4. Réseau de transport OpenStreetMap -> GeoJSON frontend
  5. Ingestion de tous les CSV vers la base SQLite (datalink.db)

Idempotent : relançable sans risque (les téléchargements existants sont
conservés ; les CSV sont reconstruits depuis les sources locales).
Chaque étape de construction vérifie la cohérence des données (sommes vs
totaux officiels) et échoue explicitement en cas d'incohérence.

Prérequis : pip install -r requirements.txt (+ xlrd, openpyxl déjà listés)
Durée typique : ~2 min avec cache local, ~10 min depuis zéro (téléchargements).
"""
import os
import subprocess
import sys
import time
from pathlib import Path

sys.stdout.reconfigure(encoding='utf-8', errors='replace')

BACKEND = Path(__file__).resolve().parent.parent

# (nom affiché, arguments du process, critique ?)
STEPS = [
    ("1/11  Catalogue publications ANSD",        ["scripts/scrape_ansd_all.py"],        True),
    ("2/11  Téléchargement XLSX officiels",      ["scripts/download_ansd_files.py"],    True),
    ("3/11  Population RGPH-5 (2023)",           ["scripts/build_population_csv.py"],   True),
    ("4/11  Projections régions 2023-2050",      ["scripts/build_projections_csv.py"],  True),
    ("5/11  Santé par région (DPRS/MSAS)",       ["scripts/build_health_csv.py"],       True),
    ("6/11  PIB régional (comptes régionaux)",   ["scripts/build_gdp_csv.py"],          True),
    ("7/11  Commerce extérieur (DGIT)",          ["scripts/build_trade_csv.py"],        True),
    ("8/11  Indicateurs nationaux (IHPC)",       ["scripts/build_indicators_csv.py"],   True),
    ("9/11  Transport OSM -> GeoJSON",           ["scripts/fetch_transport_osm.py"],    False),
    ("10/11 Nettoyage points transport",         ["scripts/clean_transport_points.py"], False),
    ("11/11 Ingestion SQLite",                   ["-m", "scripts.ingest"],              True),
]


def run_step(name, args, critical):
    print(f"\n{'=' * 64}\n>>> {name} {'(critique)' if critical else '(optionnel)'}\n{'=' * 64}")
    env = dict(os.environ)
    env["PYTHONIOENCODING"] = "utf-8"
    env["PYTHONPATH"] = str(BACKEND)
    t0 = time.time()
    try:
        proc = subprocess.run(
            [sys.executable, *args],
            cwd=str(BACKEND), env=env,
            encoding="utf-8", errors="replace",
        )
    except Exception as e:
        print(f"!! ERREUR lancement : {e}")
        return False
    dt = time.time() - t0
    ok = proc.returncode == 0
    status = "OK" if ok else f"ÉCHEC (code {proc.returncode})"
    print(f"<<< {name} : {status} ({dt:.1f}s)")
    return ok


def main():
    print("=" * 64)
    print("DATA LINK -- Installation complète des données officielles")
    print("Sources : ANSD (ansd.sn), MSAS/DPRS, DGIT, OpenStreetMap")
    print("=" * 64)

    results = []
    for name, args, critical in STEPS:
        ok = run_step(name, args, critical)
        results.append((name, ok, critical))
        if not ok and critical:
            print(f"\n!! Étape critique échouée : {name}. Arrêt.")
            break

    # Résumé
    print("\n" + "=" * 64)
    print("RÉSUMÉ")
    print("=" * 64)
    failed_critical = 0
    for name, ok, critical in results:
        mark = "OK  " if ok else ("FAIL" if critical else "warn")
        print(f" [{mark}] {name}")
        if not ok and critical:
            failed_critical += 1

    if failed_critical == 0:
        print("\n✓ Données prêtes ! Démarre l'API : uvicorn app.main:app --reload")
        return 0
    print(f"\n✗ {failed_critical} étape(s) critique(s) en échec — corrige puis relance.")
    return 1


if __name__ == "__main__":
    raise SystemExit(main())
