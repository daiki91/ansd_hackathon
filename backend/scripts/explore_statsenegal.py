import urllib.request
import ssl
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

url = 'https://www.statsenegal.sn/donnees'
try:
    html = fetch(url)
    open(r'C:\Users\Birame\ansd_hackathon\backend\data\raw\statsenegal_page.html', 'w', encoding='utf-8').write(html)
    print('OK', len(html), 'chars')
except Exception as e:
    print('ERR direct:', e)
