"""Nettoie transport_points.geojson : garde les aéroports et les ports réels,
déduplique par proximité (~1 km), exclut les petits quais sans importance."""
import json
import re
import sys
from pathlib import Path

sys.stdout.reconfigure(encoding='utf-8', errors='replace')

P = Path(r'C:\Users\Birame\ansd_hackathon\frontend\public\geo\transport_points.geojson')
fc = json.loads(P.read_text(encoding='utf-8'))

# Ports majeurs connus (référence officielle ANSD/Port Autonome) — on garde tout
# point nommé "Port..." mais on déduplique par zone.
MAJOR_PORT_HINT = re.compile(r'port|ferry|quai', re.IGNORECASE)

# Ports maritimes majeurs (références officielles ANSD/Port Autonome de Dakar)
MAJOR_PORTS = [
    {'name': "Port Autonome de Dakar", 'lon': -17.4292, 'lat': 14.6672},
    {'name': "Port de pêche de Soumbédioune", 'lon': -17.4444, 'lat': 14.6589},
    {'name': "Port du Futur de Ndayane (projet)", 'lon': -17.3236, 'lat': 14.5367},
    {'name': "Port de Rufisque", 'lon': -17.2647, 'lat': 14.6806},
    {'name': "Port de Bargny", 'lon': -17.2292, 'lat': 14.6942},
    {'name': "Port de Saint-Louis", 'lon': -16.4916, 'lat': 16.0280},
    {'name': "Port de Kaolack", 'lon': -16.0762, 'lat': 14.1512},
    {'name': "Port de Foundiougne", 'lon': -16.4689, 'lat': 14.2422},
    {'name': "Port de Fatick", 'lon': -16.4111, 'lat': 14.3381},
    {'name': "Port de Joal-Fadiouth", 'lon': -16.8442, 'lat': 14.1667},
    {'name': "Port de Mbour", 'lon': -17.0322, 'lat': 14.4200},
    {'name': "Port de Ziguinchor", 'lon': -16.2719, 'lat': 12.5833},
    {'name': "Port d'Elinkine", 'lon': -16.7000, 'lat': 12.3833},
]

kept = []
seen_airport = set()
seen_port_zone = set()
for f in fc['features']:
    kind = f['properties']['kind']
    name = f['properties']['name']
    lon, lat = f['geometry']['coordinates']
    if kind == 'airport':
        if name.strip().lower() == 'aérodrome':
            continue   # sans nom
        key = (round(lat, 2), round(lon, 2))
        if key in seen_airport:
            continue
        seen_airport.add(key)
        kept.append(f)
    else:
        # Exclure les terminaux/génériques non nommés : les vrais ports sont ajoutés ci-dessous
        if not name or name.lower() in ('terminal ferry', 'port'):
            continue
        key = (round(lat * 18), round(lon * 18))
        if key in seen_port_zone:
            continue
        seen_port_zone.add(key)
        kept.append(f)

# Ajouter les ports officiels majeurs (sans doublon de zone)
existing_zones = {(round(f['geometry']['coordinates'][1] * 18), round(f['geometry']['coordinates'][0] * 18)) for f in kept if f['properties']['kind'] == 'port'}
for mp in MAJOR_PORTS:
    key = (round(mp['lat'] * 18), round(mp['lon'] * 18))
    if key not in existing_zones:
        kept.append({
            'type': 'Feature',
            'properties': {'kind': 'port', 'name': mp['name']},
            'geometry': {'type': 'Point', 'coordinates': [mp['lon'], mp['lat']]},
        })

airports = [f for f in kept if f['properties']['kind'] == 'airport']
ports = [f for f in kept if f['properties']['kind'] == 'port']

out = {'type': 'FeatureCollection', 'features': kept}
P.write_text(json.dumps(out, ensure_ascii=False), encoding='utf-8')
print(f'Aéroports ({len(airports)}):')
for a in sorted(airports, key=lambda x: x['properties']['name']):
    print('  -', a['properties']['name'])
print(f'Ports/zones maritimes ({len(ports)}):')
for a in sorted(ports, key=lambda x: x['properties']['name'])[:25]:
    print('  -', a['properties']['name'])
print(f'OK -> {P} ({len(kept)} points)')
