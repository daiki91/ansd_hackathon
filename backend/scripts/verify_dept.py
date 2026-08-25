import sys

sys.stdout.reconfigure(encoding='utf-8', errors='replace')

from app.services.data_service import load_department_projections, load_projections

d = load_department_projections()
print('dept projections:', len(d), 'lignes')
y26 = [x for x in d if x['year'] == 2026]
total = sum(x['population'] for x in y26)
print(f"2026: {len(y26)} départements, total {total:,}")
top = sorted(y26, key=lambda x: -x['population'])[:5]
for x in top:
    print(f"  {x['departement']}: {x['population']:,}")

r = load_projections()
y26r = [x for x in r if x['year'] == 2026]
tot_r = sum(x['population'] for x in y26r)
print(f"\nRégions 2026: total {tot_r:,} (cohérent si proche de {total:,})")
assert abs(total - tot_r) < 1000, 'somme départements != somme régions !'
print('VALIDATION OK : somme des 46 départements = somme des 14 régions')
