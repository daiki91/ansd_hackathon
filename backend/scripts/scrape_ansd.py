import urllib.request
import re
import ssl

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

url = 'https://www.ansd.sn/toutes-les-publications?field_types_de_document_value=2'
html = fetch(url)
open(r'C:\Users\Birame\ansd_hackathon\backend\data\raw\ansd_page0.html', 'w', encoding='utf-8').write(html)
print('OK', len(html), 'chars')

# Pagination info
pages = sorted(set(re.findall(r'page=(\d+)', html)), key=int)
print('pagination refs:', pages[:20])

# Count items on page
items = re.findall(r'href="(https?://www\.ansd\.sn/sites/default/files/[^"]+)"', html)
print('file links:', len(items))
for i in items[:10]:
    print(' ', i)

# Titles pattern
titles = re.findall(r'<a href="(/[^"]*publication[^"]*)"[^>]*>([^<]{4,120})</a>', html)
print('pub links:', len(titles))
for t in titles[:10]:
    print(' ', t)
