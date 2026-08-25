import urllib.request
import ssl
import sys
import json

sys.stdout.reconfigure(encoding='utf-8', errors='replace')

CTX = ssl.create_default_context()
CTX.check_hostname = False
CTX.verify_mode = ssl.CERT_NONE

HDRS = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/126.0.0.0 Safari/537.36',
    'Accept': 'application/json,text/html,*/*',
}

def get(url):
    req = urllib.request.Request(url, headers=HDRS)
    with urllib.request.urlopen(req, timeout=30, context=CTX) as r:
        ct = r.headers.get('content-type', '')
        body = r.read()
        return ct, body

endpoints = [
    '/api/actualites',
    '/api/hiswaca-docs',
    '/api/lois-reglements',
    '/api/rapports-activites',
    '/api/rapports-snds',
    '/api/structures-ssn',
]

for ep in endpoints:
    url = f'https://www.statsenegal.sn{ep}'
    try:
        ct, body = get(url)
        print(f'=== {ep} [{ct}] {len(body)} bytes')
        if 'json' in ct:
            try:
                data = json.loads(body)
                s = json.dumps(data, ensure_ascii=False)[:400]
                print('   ', s.replace(chr(10), ' '))
            except Exception:
                print('   ', body[:200])
        else:
            print('   ', body[:150])
        open(rf'C:\Users\Birame\ansd_hackathon\backend\data\raw\statsenegal_{ep.strip("/").replace("/", "_")}.json', 'wb').write(body)
    except Exception as e:
        print(f'=== {ep} ERR {e}')
