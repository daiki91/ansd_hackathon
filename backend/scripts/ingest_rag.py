"""Ingest CSV data files into the ChromaDB vector store for RAG.

Usage:
    python -m scripts.ingest_rag

Reads data/raw/*.csv and ingests them as text documents into ChromaDB
so the AI assistant can answer questions about the data.
"""

import sys
from pathlib import Path

import pandas as pd

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from app.services.rag.pipeline import ingest_text

DATA_DIR = Path(__file__).resolve().parent.parent / "data" / "raw"


def csv_to_text(filepath: Path, source_name: str) -> str:
    """Convert a CSV file to readable text for RAG ingestion."""
    df = pd.read_csv(filepath, comment="#")
    lines = [f"=== {source_name} ==="]

    for _, row in df.iterrows():
        parts = [f"{col}: {val}" for col, val in row.items() if pd.notna(val)]
        lines.append(" | ".join(parts))

    return "\n".join(lines)


def main():
    total = 0

    files = {
        "population.csv": "Population du Sénégal par région (RGPH-5, 2023)",
        "etablissements_sante.csv": "Établissements de santé du Sénégal par région et type",
        "commerce_exterieur.csv": "Commerce extérieur du Sénégal - exportations et importations par pays",
        "indicateurs_nationaux.csv": "Indicateurs nationaux du Sénégal - économie et démographie",
    }

    for filename, source_name in files.items():
        filepath = DATA_DIR / filename
        if not filepath.exists():
            print(f"  SKIP {filename} (not found)")
            continue

        text = csv_to_text(filepath, source_name)
        result = ingest_text(text, source_name=source_name)
        count = result.get("chunks_ingested", 0)
        total += count
        print(f"  OK {source_name}: {count} chunks ({result.get('total_text_length', 0)} chars)")

    print(f"\nTotal: {total} chunks ingested into ChromaDB")


if __name__ == "__main__":
    main()
