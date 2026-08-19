"""Protection des routes par clé API (RNF-03 : "Protection des accès à l'API
-- clés API, quotas, limitation de débit").

Implémentation minimale pour le prototype : vérification d'une clé API dans
l'en-tête ``X-API-Key`` contre une liste de clés valides définie en
configuration. Les quotas et la limitation de débit sont laissés comme
évolution (voir README backend), à brancher par exemple via un middleware ou
un service comme Redis + slowapi lorsque l'API sera exposée publiquement.
"""

from fastapi import Header, HTTPException, status

from app.core.config import get_settings


async def require_api_key(x_api_key: str | None = Header(default=None)) -> None:
    """Dépendance FastAPI à ajouter aux routes qui doivent être protégées.

    Si REQUIRE_API_KEY=false (valeur par défaut en développement), la
    vérification est ignorée afin de ne pas bloquer les tests locaux.
    """
    settings = get_settings()
    if not settings.REQUIRE_API_KEY:
        return

    valid_keys = settings.api_keys_set
    if not valid_keys or x_api_key not in valid_keys:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Clé API manquante ou invalide. Fournissez un en-tête 'X-API-Key' valide.",
        )
