import sys
import xlrd
from pathlib import Path

sys.stdout.reconfigure(encoding='utf-8', errors='replace')

D = Path(r'C:\Users\Birame\ansd_hackathon\backend\data\raw\ansd_downloads')

# Find the santé file
f = [p for p in D.iterdir() if 'SANTE' in p.name.upper()][0]
print('FILE:', f.name, f.stat().st_size // 1024, 'Ko\n')

wb = xlrd.open_workbook(str(f))
print('SHEETS:', wb.sheet_names(), '\n')

for sn in wb.sheet_names()[:6]:
    sh = wb.sheet_by_name(sn)
    print(f'===== SHEET "{sn}" ({sh.nrows} rows x {sh.ncols} cols) =====')
    for r in range(min(sh.nrows, 25)):
        vals = []
        for c in range(min(sh.ncols, 12)):
            v = sh.cell_value(r, c)
            if isinstance(v, float) and v == int(v):
                v = int(v)
            s = str(v)[:22]
            vals.append(s)
        line = ' | '.join(vals).rstrip(' |')
        if line.strip():
            print(f'  {r:3d}: {line[:150]}')
    print()
