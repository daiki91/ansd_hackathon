import sys

sys.stdout.reconfigure(encoding='utf-8', errors='replace')

from app.routers.population_data import get_projections
from app.services.data_service import load_projections

allp = load_projections()
years = sorted({r['year'] for r in allp})
print(f'Projections: {len(allp)} lignes, années {years[0]}..{years[-1]}')

r = get_projections(year=2026)
tot = sum(p['population'] for p in r['projections'])
print(f"2026: {len(r['projections'])} régions, total {tot:,}")
top = sorted(r['projections'], key=lambda x: -x['population'])[:3]
for p in top:
    print(' ', p)
