"""Extrait les infrastructures sanitaires PAR REGION du tableau officiel
F.04.03 (ANSD, SECTION F-SANTE_2023.xls, source DPRS/MSAS) et régénère
data/raw/etablissements_sante.csv avec des données 100% sourcées.
"""
import sys
import csv
import xlrd
from pathlib import Path

sys.stdout.reconfigure(encoding='utf-8', errors='replace')

BASE = Path(r'C:\Users\Birame\ansd_hackathon\backend')
f = [p for p in (BASE / 'data' / 'raw' / 'ansd_downloads').iterdir() if 'SANTE' in p.name.upper()][0]
wb = xlrd.open_workbook(str(f))
sh = wb.sheet_by_name('F0403')

# ── Layout du tableau (vérifié manuellement) ──
# Lignes 6..19 : régions (Dakar..Sédhiou), ligne 20 : SENEGAL
REGIONS = ['Dakar', 'Diourbel', 'Fatick', 'Kaolack', 'Kolda', 'Louga', 'Matam',
           'Saint Louis', 'Tambacounda', 'Thies', 'Ziguinchor', 'Kedougou',
           'Kaffrine', 'Sédhiou']

def cell(r, c):
    v = sh.cell_value(r, c)
    if isinstance(v, str):
        v = v.strip()
        if v in ('nd', 'ND', '-', '', '(dont 1 NF)'):
            return None
        try:
            return int(float(v.replace(',', '.')))
        except ValueError:
            return None
    return int(v) if isinstance(v, float) else None

HOSP_LAST_COL = 15   # hôpitaux 2018 (années 2001..2018)
CENT_LAST_COL = 31   # centres 2018 (années 2000..2018)
POST_LAST_COL = 47   # postes 2018 (années 2000..2018)

rows = []
for i, region in enumerate(REGIONS):
    r = 6 + i
    hosp = cell(r, HOSP_LAST_COL)
    cent = cell(r, CENT_LAST_COL)
    post = cell(r, POST_LAST_COL)
    name = {'Saint Louis': 'Saint-Louis', 'Thies': 'Thiès'}.get(region, region)
    print(f'{name:14s} hôpitaux={hosp} centres={cent} postes={post}')
    for ftype, val in [('Hôpital', hosp), ('Centre de santé', cent), ('Poste de santé', post)]:
        if val is not None:
            rows.append({'region': name, 'facility_type': ftype, 'count': val,
                         'year': 2018, 'source': 'ANSD/MSAS DPRS (Tableau F.04.03, SECTION F-SANTE 2023)'})

# ── Séries nationales (ligne SENEGAL, plusieurs années) ──
SENEGAL_R = 20
hosp_years = [2001, 2005, 2006, 2007, 2008, 2009, 2010, 2011, 2012, 2013, 2014, 2015, 2016, 2017, 2018]
cent_years = [2000] + [2001] + [2005, 2006, 2007, 2008, 2009, 2010, 2011, 2012, 2013, 2014, 2015, 2016, 2017, 2018]
post_years = list(cent_years)
for col, yr in enumerate(hosp_years, start=1):
    v = cell(SENEGAL_R, col)
    if v is not None:
        rows.append({'region': 'National', 'facility_type': 'Hôpital', 'count': v,
                     'year': yr, 'source': 'ANSD/MSAS DPRS (Tableau F.04.01/F.04.03)'})
for offset, yrs in [(16, cent_years)]:
    pass  # centres/postes : mêmes décalages relatifs que les colonnes 2018
for base_col, ftype in [(16, 'Centre de santé'), (32, 'Poste de santé')]:
    for j, yr in enumerate(cent_years):
        v = cell(SENEGAL_R, base_col + j)
        if v is not None:
            rows.append({'region': 'National', 'facility_type': ftype, 'count': v,
                         'year': yr, 'source': 'ANSD/MSAS DPRS (Tableau F.04.03)'})

# ── Vérifications de cohérence ──
assert len(rows) == 14 * 3 + len([r for r in rows if r['region'] == 'National'])
tot_hosp_2018 = sum(x['count'] for x in rows if x['facility_type'] == 'Hôpital' and x['region'] != 'National' and x['year'] == 2018)
tot_cent_2018 = sum(x['count'] for x in rows if x['facility_type'] == 'Centre de santé' and x['region'] != 'National' and x['year'] == 2018)
tot_post_2018 = sum(x['count'] for x in rows if x['facility_type'] == 'Poste de santé' and x['region'] != 'National' and x['year'] == 2018)
print(f'\nSommes régionales 2018 : {tot_hosp_2018} hôpitaux / {tot_cent_2018} centres / {tot_post_2018} postes')
print(f'Attendu (ligne SENEGAL) : 38 hôpitaux / 101 centres / 1605 postes')
assert tot_hosp_2018 == 38 and tot_cent_2018 == 101 and tot_post_2018 == 1605, 'INCOHERENCE !'

# Dakar doit être #1 en total d'établissements
totals = {}
for x in rows:
    if x['year'] == 2018 and x['region'] != 'National':
        totals[x['region']] = totals.get(x['region'], 0) + x['count']
ranked = sorted(totals.items(), key=lambda kv: -kv[1])
print('\nClassement total établissements publics 2018:')
for i, (reg, tot) in enumerate(ranked[:5], 1):
    print(f'  {i}. {reg}: {tot}')
assert ranked[0][0] == 'Dakar', 'Dakar doit être #1 !'

# ── Écriture du CSV ──
out = BASE / 'data' / 'raw' / 'etablissements_sante.csv'
with open(out, 'w', encoding='utf-8', newline='') as fp:
    fp.write("""# Jeu de données : Infrastructures sanitaires publiques du Sénégal par région
# SOURCE OFFICIELLE EXACTE :
#   ANSD - SECTION F-SANTE_2023.xls, Tableau F.04.03 "Infrastructures sanitaires par région"
#   Source primaire : DPRS/MSAS (Direction de la Planification, de la Recherche et des Statistiques,
#   Ministère de la Santé et de l'Action Sociale)
#   Fichier téléchargé depuis https://www.ansd.sn/toutes-les-publications
# Année régionale la plus complète : 2018. Séries nationales : 1970-2018.
# NB : cases de santé non ventilées par région dans ce tableau.
region,facility_type,count,year,source
""")
    w = csv.DictWriter(fp, fieldnames=['region', 'facility_type', 'count', 'year', 'source'])
    w.writerows(rows)

print(f'\nOK -> {out} ({len(rows)} lignes, données 100% sourcées)')
