"""Télécharge le réseau de transport sénégalais depuis OpenStreetMap (Overpass API)
et génère des GeoJSON légers pour la carte :
  - frontend/public/geo/transport_roads.geojson   (autoroutes + routes nationales)
  - frontend/public/geo/transport_railways.geojson (voies ferrées, TER inclus)
  - frontend/public/geo/transport_points.geojson   (aéroports + ports maritimes)
"""
import sys
import json
import urllib.request
from pathlib import Path

sys.stdout.reconfigure(encoding='utf-8', errors='replace')

OUT = Path(r'C:\Users\Birame\ansd_hackathon\frontend\public\geo')
OUT.mkdir(parents=True, exist_ok=True)

OVERPASS = 'https://overpass-api.de/api/interpreter'


def overpass(query):
    data = urllib.parse.urlencode({'data': query}).encode()
    req = urllib.request.Request(OVERPASS, data=data, headers={'User-Agent': 'DataLink/1.0'})
    with urllib.request.urlopen(req, timeout=300) as r:
        return json.loads(r.read().decode())


def rnd(c):
    """Arrondit les coords à 4 décimales (~11 m) pour alléger les fichiers."""
    return [round(c[0], 4), round(c[1], 4)]


# ── 1. Routes majeures + voies ferrées ──
q_lines = """
[out:json][timeout:300];
area["ISO3166-1"="SN"][admin_level=2]->.sn;
(
  way(area.sn)["highway"~"^(motorway|trunk|primary)$"];
  way(area.sn)["railway"~"^(rail|light_rail)$"];
);
out geom;
"""
print('Fetch Overpass (routes+rails)...')
data = overpass(q_lines)
els = data.get('elements', [])
print(f'  {len(els)} ways')

roads, rails = [], []
for e in els:
    if e.get('type') != 'way' or 'geometry' not in e:
        continue
    coords = [rnd([p['lon'], p['lat']]) for p in e['geometry']]
    if len(coords) < 2:
        continue
    t = e.get('tags', {})
    is_rail = 'railway' in t
    feat = {
        'type': 'Feature',
        'properties': {
            'kind': 'rail' if is_rail else ('motorway' if t.get('highway') == 'motorway' else 'trunk' if t.get('highway') == 'trunk' else 'primary'),
            'name': t.get('name', '')[:60],
            'ref': t.get('ref', ''),
        },
        'geometry': {'type': 'LineString', 'coordinates': coords},
    }
    (rails if is_rail else roads).append(feat)

print(f'  routes majeures: {len(roads)} | voies ferrées: {len(rails)}')

for name, feats in [('transport_roads.geojson', roads), ('transport_railways.geojson', rails)]:
    fc = {'type': 'FeatureCollection', 'features': feats}
    (OUT / name).write_text(json.dumps(fc, ensure_ascii=False), encoding='utf-8')
    print(f'OK -> {name} ({(OUT / name).stat().st_size // 1024} Ko)')

# ── 2. Aéroports + ports ──
q_points = """
[out:json][timeout:120];
area["ISO3166-1"="SN"][admin_level=2]->.sn;
(
  node(area.sn)["aeroway"="aerodrome"];
  way(area.sn)["aeroway"="aerodrome"];
  node(area.sn)["landuse"="port"];
  way(area.sn)["landuse"="port"];
  node(area.sn)["man_made"="pier"];
  node(area.sn)["amenity"="ferry_terminal"];
);
out center tags;
"""
print('Fetch Overpass (aéroports+ports)...')
data = overpass(q_points)
points = []
seen = set()
for e in data.get('elements', []):
    t = e.get('tags', {})
    lat = e.get('lat') or (e.get('center') or {}).get('lat')
    lon = e.get('lon') or (e.get('center') or {}).get('lon')
    if lat is None:
        continue
    if 'aeroway' in t:
        kind, label = 'airport', t.get('name') or t.get('aerodrome', 'Aérodrome')
    elif 'ferry_terminal' in str(t):
        kind, label = 'port', t.get('name') or 'Terminal ferry'
    elif t.get('landuse') == 'port':
        kind, label = 'port', t.get('name') or 'Port'
    elif t.get('man_made') == 'pier':
        # trop granulaire : ne garder que celles nommées (quais majeurs)
        if not t.get('name'):
            continue
        kind, label = 'port', t['name']
    else:
        continue
    key = (round(lat, 3), round(lon, 3), kind)
    if key in seen:
        continue
    seen.add(key)
    points.append({
        'type': 'Feature',
        'properties': {'kind': kind, 'name': str(label)[:60]},
        'geometry': {'type': 'Point', 'coordinates': [round(lon, 4), round(lat, 4)]},
    })

airports = [p for p in points if p['properties']['kind'] == 'airport']
ports = [p for p in points if p['properties']['kind'] == 'port']
print(f'  aéroports: {len(airports)} | ports/quais nommés: {len(ports)}')

fc = {'type': 'FeatureCollection', 'features': points}
(OUT / 'transport_points.geojson').write_text(json.dumps(fc, ensure_ascii=False), encoding='utf-8')
print(f"OK -> transport_points.geojson ({(OUT / 'transport_points.geojson').stat().st_size // 1024} Ko)")
