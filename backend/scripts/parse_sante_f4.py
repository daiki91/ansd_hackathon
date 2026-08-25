import sys
import xlrd
from pathlib import Path

sys.stdout.reconfigure(encoding='utf-8', errors='replace')

D = Path(r'C:\Users\Birame\ansd_hackathon\backend\data\raw\ansd_downloads')

f = [p for p in D.iterdir() if 'SANTE' in p.name.upper()][0]
wb = xlrd.open_workbook(str(f))

for sn in ['F0401', 'F0402', 'F0403', 'F0501', 'F0503']:
    sh = wb.sheet_by_name(sn)
    print(f'===== SHEET "{sn}" ({sh.nrows}x{sh.ncols}) =====')
    for r in range(min(sh.nrows, 30)):
        vals = []
        for c in range(min(sh.ncols, 14)):
            v = sh.cell_value(r, c)
            if isinstance(v, float) and v == int(v):
                v = int(v)
            vals.append(str(v)[:20])
        line = ' | '.join(vals).rstrip(' |')
        if line.strip():
            print(f'  {r:3d}: {line[:170]}')
    print()
