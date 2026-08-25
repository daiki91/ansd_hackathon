import urllib.request
import ssl
import sys
import json
import time
from pathlib import Path

sys.stdout.reconfigure(encoding='utf-8', errors='replace')

CTX = ssl.create_default_context()
CTX.check_hostname = False
CTX.verify_mode = ssl.CERT_NONE

HDRS = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/126.0.0.0 Safari/537.36',
    'Accept': '*/*',
    'Referer': 'https://www.ansd.sn/toutes-les-publications',
}

OUT = Path(r'C:\Users\Birame\ansd_hackathon\backend\data\raw\ansd_downloads')
OUT.mkdir(parents=True, exist_ok=True)

catalog = json.load(open(OUT.parent / 'ansd_publications.json', encoding='utf-8'))
print(f'{len(catalog)} fichiers a telecharger')

ok = fail = 0
for i, item in enumerate(catalog):
    url = item['url']
    fname = item['filename'].replace('/', '-').replace('%20', ' ')
    if not fname.lower().endswith(('.xlsx', '.xls', '.pdf', '.zip', '.docx')):
        fname += '.bin'
    dest = OUT / f"{i:02d}_{fname}"
    if dest.exists() and dest.stat().st_size > 1000:
        ok += 1
        continue
    try:
        req = urllib.request.Request(url, headers=HDRS)
        with urllib.request.urlopen(req, timeout=90, context=CTX) as r:
            data = r.read()
        if len(data) < 500:
            raise ValueError(f'too small: {len(data)}')
        dest.write_bytes(data)
        print(f"[{i+1}/{len(catalog)}] OK {len(data)//1024} Ko <- {fname[:70]}")
        ok += 1
        time.sleep(0.3)
    except Exception as e:
        print(f"[{i+1}/{len(catalog)}] FAIL {fname[:60]} : {e}")
        fail += 1

print(f'\nTelecharges: {ok} | Echecs: {fail}')
