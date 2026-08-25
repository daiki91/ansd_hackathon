import urllib.request
import ssl
import sys
import json

sys.stdout.reconfigure(encoding='utf-8', errors='replace')

CTX = ssl.create_default_context()
CTX.check_hostname = False
CTX.verify_mode = ssl.CERT_NONE

BASE = 'https://nso-senegal.opendataforafrica.org'
HDRS = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/126.0.0.0 Safari/537.36',
    'Accept': 'application/json, text/javascript, */*; q=0.01',
    'Accept-Language': 'fr-FR,fr;q=0.9,en;q=0.8',
    'Referer': f'{BASE}/apps/data-catalog',
    'X-Requested-With': 'XMLHttpRequest',
}

def get(url):
    req = urllib.request.Request(url, headers=HDRS)
    with urllib.request.urlopen(req, timeout=30, context=CTX) as r:
        return r.read()

def post_json(url, obj):
    hdrs = dict(HDRS)
    hdrs['Content-Type'] = 'application/json'
    req = urllib.request.Request(url, data=json.dumps(obj).encode(), headers=hdrs, method='POST')
    with urllib.request.urlopen(req, timeout=30, context=CTX) as r:
        return r.read()

tests_get = [
    '/api/1.0/sdmx/dataflow',
    '/api/1.0/sdmx/dataflows',
    '/api/1.0/sdmx/all,dataflows,latest',
    '/api/datasets',
]
for t in tests_get:
    try:
        d = get(BASE + t)
        print(f'[GET {t}] OK {len(d)} ->', d[:250])
        open(rf'C:\Users\Birame\ansd_hackathon\backend\data\raw\nso_{t.strip("/").replace("/","_")}.json', 'wb').write(d)
    except Exception as e:
        print(f'[GET {t}] ERR {e}')

# Knoema browse search
for body in [
    {'query': '', 'pageSize': 50, 'pageIndex': 0},
    {'searchText': '', 'page': 0},
]:
    for path in ['/api/v1/search/browse', '/api/v1/search', '/api/search']:
        try:
            d = post_json(BASE + path, body)
            print(f'[POST {path}] OK {len(d)} ->', d[:300])
            open(rf'C:\Users\Birame\ansd_hackathon\backend\data\raw\nso_search.json', 'wb').write(d)
            sys.exit(0)
        except Exception as e:
            print(f'[POST {path}] ERR {e}')
