from pypdf import PdfReader

r = PdfReader(r'C:\Users\Birame\Downloads\Projections-demographiques_2023-2073-.pdf')
print(f'Total pages: {len(r.pages)}')

# Look for data tables - search pages 10-60 for population projection tables
for i in range(10, min(60, len(r.pages))):
    text = r.pages[i].extract_text()
    if any(kw in text.lower() for kw in ['population totale', 'projection', 'region', 'tableau']):
        print(f'\n=== Page {i+1} ===')
        print(text[:4000])
