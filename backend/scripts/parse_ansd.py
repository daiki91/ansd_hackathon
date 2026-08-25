import re

html = open(r'C:\Users\Birame\ansd_hackathon\backend\data\raw\ansd_page0.html', encoding='utf-8').read()

# Extract file links with context (all extensions)
files = re.findall(r'href="(/sites/default/files/[^"]+\.(?:xlsx?|pdf|zip|docx?))"', html)
print('ALL files:', len(files))
for f in files:
    print(' ', f)

print()
# Look at views-row structure
rows = re.findall(r'<div class="views-row[^"]*">(.*?)</article>', html, re.DOTALL)
print('views-rows:', len(rows))

# Alternative: find article/h2 titles
h3s = re.findall(r'<h3[^>]*>\s*<a href="([^"]+)"[^>]*>(.*?)</a>', html, re.DOTALL)
print('h3 links:', len(h3s))
for h in h3s[:15]:
    print(' ', h[0][:80], '|', re.sub(r'\s+', ' ', re.sub(r'<[^>]+>', '', h[1]))[:80])
