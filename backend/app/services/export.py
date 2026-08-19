"""Export des jeux de données dans plusieurs formats (RF-14 : "Open Data avec
téléchargement des jeux de données dans plusieurs formats (CSV, Excel,
JSON)").
"""

import io
import json
from typing import Any, Literal

import pandas as pd
from fastapi import HTTPException, status
from fastapi.responses import Response

ExportFormat = Literal["csv", "excel", "json"]


def export_records(records: list[dict[str, Any]], fmt: ExportFormat, filename: str) -> Response:
    """Sérialise une liste d'enregistrements (dicts) dans le format demandé et
    retourne une réponse HTTP prête à être téléchargée."""

    if not records:
        df = pd.DataFrame()
    else:
        df = pd.DataFrame.from_records(records)

    if fmt == "csv":
        buffer = io.StringIO()
        df.to_csv(buffer, index=False)
        return Response(
            content=buffer.getvalue(),
            media_type="text/csv",
            headers={"Content-Disposition": f'attachment; filename="{filename}.csv"'},
        )

    if fmt == "excel":
        buffer = io.BytesIO()
        with pd.ExcelWriter(buffer, engine="openpyxl") as writer:
            df.to_excel(writer, index=False, sheet_name="data")
        return Response(
            content=buffer.getvalue(),
            media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            headers={"Content-Disposition": f'attachment; filename="{filename}.xlsx"'},
        )

    if fmt == "json":
        content = json.dumps(records, ensure_ascii=False, default=str, indent=2)
        return Response(
            content=content,
            media_type="application/json",
            headers={"Content-Disposition": f'attachment; filename="{filename}.json"'},
        )

    raise HTTPException(
        status_code=status.HTTP_400_BAD_REQUEST,
        detail=f"Format d'export non supporté : {fmt}. Formats valides : csv, excel, json.",
    )
