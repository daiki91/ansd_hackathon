from pypdf import PdfReader
import csv, re

r = PdfReader(r'C:\Users\Birame\Downloads\Projections-demographiques_2023-2073-.pdf')

# Extract regional population projections from pages with "REGION" headers
# We need: Region name, RGPH-5, 2023, 2024, 2025, ... ( Ensemble columns)
regions_data = []

for i in range(10, min(80, len(r.pages))):
    text = r.pages[i].extract_text()
    if 'PROJECTION DE LA POPULATION DE LA REGION' not in text.upper():
        continue
    
    lines = text.split('\n')
    region_name = None
    
    for line in lines:
        line = line.strip()
        if 'REGION' in line.upper() and any(r in line.upper() for r in ['DAKAR', 'THIES', 'DIOURBEL', 'FATICK', 'KAOLACK', 'KAFFRINE', 'KEDOUGOU', 'KOLDA', 'LOUGA', 'MATAM', 'SAINT', 'SEDHIOU', 'TAMBACOUNDA', 'ZIGUINCHOR']):
            # Extract region name
            for rname in ['Saint Louis', 'Saint-Louis', 'Saint Louis', 'Kedougou', 'Kédougou', 'Sedhiou', 'Sédhiou', 'Dakar', 'Thies', 'Thiès', 'Diourbel', 'Fatick', 'Kaolack', 'Kaffrine', 'Kolda', 'Louga', 'Matam', 'Tambacounda', 'Ziguinchor']:
                if rname.upper() in line.upper():
                    region_name = rname
                    break
            if not region_name:
                # Try to extract from pattern like "REGION SAINT-LOUIS" or "REGION DE KOLDA"
                m = re.search(r'REGION\s+(?:DE\s+)?(.+?)(?:\s+-|\s+$)', line, re.IGNORECASE)
                if m:
                    region_name = m.group(1).strip()
            break
    
    if not region_name:
        continue
    
    # Find the REGION line with numbers
    for line in lines:
        line = line.strip()
        if 'REGION' in line.upper() and any(c.isdigit() for c in line):
            # Parse numbers from this line
            numbers = re.findall(r'[\d\s]+', line)
            numbers = [int(n.replace(' ', '')) for n in numbers if n.strip() and len(n.strip()) >= 3]
            if len(numbers) >= 4:
                # Format: RGPH5_H, RGPH5_F, RGPH5_Total, 2023_H, 2023_F, 2023_Total, ...
                regions_data.append({
                    'region': region_name,
                    'rgph5_total': numbers[2] if len(numbers) > 2 else numbers[0],
                    'pop_2023': numbers[5] if len(numbers) > 5 else numbers[2],
                    'pop_2024': numbers[8] if len(numbers) > 8 else None,
                    'pop_2025': numbers[11] if len(numbers) > 11 else None,
                })
            break

print(f'Found {len(regions_data)} regions')
for d in regions_data:
    print(f"  {d['region']}: RGPH5={d['rgph5_total']}, 2023={d['pop_2023']}")
