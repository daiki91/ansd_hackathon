from fastapi import APIRouter

router = APIRouter(tags=["Santé du service"])


@router.get("/health", summary="Vérifie que l'API répond")
def health_check() -> dict[str, str]:
    return {"status": "ok", "service": "DATA LINK API"}
