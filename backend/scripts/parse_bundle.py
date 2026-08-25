import re
import sys

sys.stdout.reconfigure(encoding='utf-8', errors='replace')

js = open(r'C:\Users\Birame\ansd_hackathon\backend\data\raw\statsenegal_bundle.js', encoding='utf-8').read()

# API endpoint patterns
pats = [
    r'["\'](/api/[a-z0-9/_-]{2,60})["\']',
    r'["\'](/donnees[^"\']{0,50})["\']',
    r'["\'](/[a-z-]*(?:indicateur|donnee|dataset|tableau|statistique)[^"\']{0,50})["\']',
    r'(?:baseURL|BASE_URL)\s*[=:]\s*["\'][^"\']{0,80}["\']',
    r'\.get\(\s*["\'][^"\']{3,80}["\']',
]
for p in pats:
    ms = sorted(set(re.findall(p, js)))
    print(f'=== {p[:55]} ({len(ms)}) ===')
    for m in ms[:50]:
        print(' ', m[:110])
    print()
