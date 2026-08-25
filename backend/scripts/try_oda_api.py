import urllib.request
import json

BASE = 'https://senegal.opendataforafrica.org'
HDRS = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/126.0.0.0 Safari/537.36',
    'Accept': '*/*',
    'Referer': f'{BASE}/bzzjuq/matrice-des-principaux-indicateurs',
}

def get(url, timeout=45):
    req = urllib.request.Request(url, headers=HDRS)
    with urllib.request.urlopen(req, timeout=timeout) as r:
        return r.read()

def post_json(url, body):
    data = json.dumps(body).encode()
    hdrs = dict(HDRS)
    hdrs['Content-Type'] = 'application/json'
    req = urllib.request.Request(url, data=data, headers=hdrs, method='POST')
    with urllib.request.urlopen(req, timeout=60) as r:
        return r.read()

candidates = [
    ('sdmx star', BASE + '/api/1.0/sdmx/data/bzzjuq/*'),
    ('sdmx all', BASE + '/api/1.0/sdmx/data/bzzjuq/all'),
    ('sdmx flows', BASE + '/api/1.0/sdmx/flows'),
    ('ds meta', BASE + '/api/meta/dataset/bzzjuq'),
]

for name, url in candidates:
    try:
        d = get(url)
        print(f'[{name}] OK {len(d)} bytes ->', d[:300])
        fn = f'data/raw/oda_{name.replace(" ","_")}.bin'
        open(fn, 'wb').write(d)
    except Exception as e:
        print(f'[{name}] ERR {e}')

# Knoema classic flat-table API
for name, body in [
    ('getFromDataset', {'dataset': 'bzzjuq'}),
]:
    try:
        d = post_json(BASE + '/api/v1/data/' + name.split('get')[1].lower(), body) if False else None
    except Exception as e:
        pass

try:
    d = post_json(BASE + '/api/v1/data/getfromdataset', {'datasetId': 'bzzjuq'})
    print('[getfromdataset] OK', len(d), '->', d[:300])
except Exception as e:
    print('[getfromdataset] ERR', e)

try:
    d = get(BASE + '/api/v1/datasets/bzzjuq')
    print('[datasets] OK', len(d), '->', d[:500])
    open('data/raw/oda_datasets.json','wb').write(d)
except Exception as e:
    print('[datasets] ERR', e)
