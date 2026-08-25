import re
import sys

sys.stdout.reconfigure(encoding='utf-8', errors='replace')

js = open(r'C:\Users\Birame\ansd_hackathon\backend\data\raw\statsenegal_bundle.js', encoding='utf-8').read()
ms = sorted(set(re.findall(r'https?://[a-z0-9.-]*(?:opendataforafrica|knoema)[^"\x27\s]{0,90}', js)))
for m in ms:
    print(m)
