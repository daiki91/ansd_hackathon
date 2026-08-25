import re
import html as htmllib

raw = open(r'C:\Users\Birame\ansd_hackathon\backend\data\raw\oda_page.html', encoding='utf-8').read()

# Decode entity-encoded JSON
dec = htmllib.unescape(raw)

# Find JSON-ish config fragments mentioning dimensions / filters
for pat in [
    r'\{[^{}]{0,80}"[Ff]ilter[^{}]{0,300}\}',
    r'"dimension[s]?"\s*:\s*\[[^\]]{0,400}\]',
    r'"DataFlow[^,]{0,120}',
    r'bzzjuq[^<]{0,200}',
]:
    ms = set(re.findall(pat, dec))
    print(f'=== {pat[:45]} ===')
    for m in sorted(ms)[:10]:
        print(' ', m[:220])
    print()
