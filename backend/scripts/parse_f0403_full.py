import sys
import xlrd
from pathlib import Path

sys.stdout.reconfigure(encoding='utf-8', errors='replace')

D = Path(r'C:\Users\Birame\ansd_hackathon\backend\data\raw\ansd_downloads')
f = [p for p in D.iterdir() if 'SANTE' in p.name.upper()][0]
wb = xlrd.open_workbook(str(f))
sh = wb.sheet_by_name('F0403')

print(f'F0403 complet: {sh.nrows} rows x {sh.ncols} cols\n')
for r in range(sh.nrows):
    vals = []
    for c in range(sh.ncols):
        v = sh.cell_value(r, c)
        if isinstance(v, float) and v == int(v):
            v = int(v)
        s = str(v).strip().replace('\n', ' ')
        vals.append(s)
    line = ' | '.join(vals)
    if line.strip(' |'):
        print(f'R{r:02d}: {line[:600]}')
