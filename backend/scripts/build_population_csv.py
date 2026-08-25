"""Régénère population.csv avec les valeurs RGPH-5 2023 EXACTES
(extraites du fichier officiel ANSD Projections 2023-2050).
"""
import sys
import csv
from pathlib import Path

sys.stdout.reconfigure(encoding='utf-8', errors='replace')

BASE = Path(r'C:\Users\Birame\ansd_hackathon\backend')

# Lire la colonne 2023 du fichier officiel extrait
rows = list(csv.reader(open(BASE / 'data' / 'raw' / 'projections_regions_2023_2050.csv', encoding='utf-8')))
header = rows[5]
idx_2023 = header.index('2023')
data = [(r[0], int(r[idx_2023])) for r in rows[6:] if r[0]]
assert len(data) == 14

national = sum(v for _, v in data)
print(f'National: {national:,}')

# Parts régionales + noms avec accents corrects
NAME_MAP = {
    'DAKAR': 'Dakar', 'DIOURBEL': 'Diourbel', 'FATICK': 'Fatick',
    'KAFFRINE': 'Kaffrine', 'KAOLACK': 'Kaolack', 'KEDOUGOU': 'Kédougou',
    'KOLDA': 'Kolda', 'LOUGA': 'Louga', 'MATAM': 'Matam',
    'SAINT-LOUIS': 'Saint-Louis', 'SEDHIOU': 'Sédhiou', 'TAMBACOUNDA': 'Tambacounda',
    'THIES': 'Thiès', 'ZIGUINCHOR': 'Ziguinchor',
}

out = BASE / 'data' / 'raw' / 'population.csv'
with open(out, 'w', encoding='utf-8', newline='') as fp:
    fp.write("""# Jeu de données : Population résidente du Sénégal par région
# SOURCE OFFICIELLE EXACTE :
#   ANSD - RGPH-5 (5e Recensement Général de la Population et de l'Habitat, 2023),
#   valeurs régionales reprises du fichier officiel
#   "Projections démographiques du Sénégal 2023-2050" (colonne RGPH-5 2023)
#   téléchargé depuis https://www.ansd.sn/toutes-les-publications
# Population nationale : 18 126 390 habitants (50,6% hommes / 49,4% femmes).
# Les projections 2024-2050 sont dans projections_regions_2023_2050.csv.
region,count,share_pct,year,source
""")
    w = csv.writer(fp)
    w.writerow(['National', national, '', 2023, 'ANSD (RGPH-5, 2023)'])
    def display_name(n):
        # tolère les deux formats : 'DAKAR' ou déjà normalisé 'Dakar'
        return NAME_MAP.get(n) or NAME_MAP.get(n.upper()) or n
    for name, val in sorted(data, key=lambda x: -x[1]):
        share = round(val * 100.0 / national, 1)
        w.writerow([display_name(name), val, share, 2023,
                    'ANSD (RGPH-5 2023 via Projections 2023-2050)'])

print(f'OK -> {out}')
for name, val in sorted(data, key=lambda x: -x[1])[:5]:
    print(f'  {display_name(name)}: {val:,}')
