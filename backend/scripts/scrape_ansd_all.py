import urllib.request
import re
import ssl
import json
import time
import sys

sys.stdout.reconfigure(encoding='utf-8', errors='replace')

CTX = ssl.create_default_context()
CTX.check_hostname = False
CTX.verify_mode = ssl.CERT_NONE

HDRS = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/126.0.0.0 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,*/*;q=0.8',
    'Accept-Language': 'fr-FR,fr;q=0.9',
}

def fetch(url):
    req = urllib.request.Request(url, headers=HDRS)
    with urllib.request.urlopen(req, timeout=40, context=CTX) as r:
        return r.read().decode('utf-8', errors='replace')

BASE = 'https://www.ansd.sn'
catalog = []

for page in range(0, 12):
    url = f'{BASE}/toutes-les-publications?field_types_de_document_value=2&page={page}'
    try:
        html = fetch(url)
    except Exception as e:
        print(f'page {page}: ERR {e}')
        break

    # Each publication row: capture title link and any file links nearby
    # Try splitting on common Drupal views row markers
    chunks = re.split(r'<(article|div class="views-row)[^>]*>', html)
    files_on_page = re.findall(r'href="(/sites/default/files/[^"]+\.(?:xlsx?|pdf|zip|docx?))"', html)

    # Titles: look for node links like /node/... or /publication/...
    title_links = re.findall(r'<a href="((?:/node/\d+|/[a-z-]*publication[^"]*))"[^>]*>\s*([^<]{6,200}?)\s*</a>', html)

    if not files_on_page:
        print(f'page {page}: no files, stopping')
        break

    print(f'--- page {page}: {len(files_on_page)} files')
    for f in files_on_page:
        fname = f.split('/')[-1]
        # find a title link preceding this file within the html
        idx = html.find(f)
        before = html[max(0, idx - 3000):idx]
        tm = re.findall(r'<a href="[^"]*"[^>]*>([^<>]{8,180})</a>', before)
        title = tm[-1].strip() if tm else fname
        catalog.append({
            'title': re.sub(r'\s+', ' ', title),
            'url': BASE + f.replace('&amp;', '&'),
            'filename': urllib.request.unquote(fname),
        })
    time.sleep(0.4)

# Dedup by url
seen = set()
uniq = []
for c in catalog:
    if c['url'] not in seen:
        seen.add(c['url'])
        uniq.append(c)

print(f'\nTOTAL unique files: {len(uniq)}')
for c in uniq:
    ext = c['filename'].split('.')[-1].lower()
    marker = '[XLSX]' if ext.startswith('xls') else f'[{ext}]'
    print(f" {marker} {c['title'][:90]}")

json.dump(uniq, open(r'C:\Users\Birame\ansd_hackathon\backend\data\raw\ansd_publications.json', 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
print('saved -> data/raw/ansd_publications.json')
