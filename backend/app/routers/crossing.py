"""Moteur de croisement DATA LINK -- RF-18 à RF-21 (section 4.2 du cahier des
charges : "cœur différenciant" de la plateforme). Détecte automatiquement la
dimension commune entre plusieurs jeux de données du catalogue, les croise,
génère un ou plusieurs indicateurs nommés (reconnus via une recette
sémantique quand c'est possible, ex. Population × Superficie -> densité de
population) et une phrase d'interprétation.
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.schemas.crossing import CompatibleEntry, CrossingCompatibleResponse, CrossingRunRequest, CrossingRunResponse
from app.services.crossing import engine
from app.services.crossing.adapters import ADAPTERS, detect_common_dimensions
from app.services.crossing.interpret import enhance_with_ai, generate_interpretation

router = APIRouter(prefix="/crossing", tags=["Moteur de croisement"])


@router.get(
    "/compatible",
    response_model=CrossingCompatibleResponse,
    summary="Jeux de données compatibles avec un jeu donné (dimensions communes détectées automatiquement)",
)
def get_compatible(dataset_id: str) -> CrossingCompatibleResponse:
    if dataset_id not in ADAPTERS:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Jeu de données '{dataset_id}' inconnu du moteur de croisement.")

    compatible = []
    for other_id, other_adapter in ADAPTERS.items():
        if other_id == dataset_id:
            continue
        shared = detect_common_dimensions([dataset_id, other_id])
        if shared:
            compatible.append(CompatibleEntry(dataset_id=other_id, label=other_adapter.label, shared_dimensions=shared))

    return CrossingCompatibleResponse(dataset_id=dataset_id, compatible=compatible)


@router.post(
    "/run",
    response_model=CrossingRunResponse,
    summary="Croiser 2 jeux de données ou plus et générer un indicateur interprété",
)
def run_crossing(payload: CrossingRunRequest, db: Session = Depends(get_db)) -> CrossingRunResponse:
    try:
        result = engine.cross(
            db,
            dataset_ids=payload.dataset_ids,
            measures=payload.measures,
            dimension=payload.dimension,
            year=payload.year,
        )
    except KeyError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Jeu de données '{e.args[0]}' inconnu du moteur de croisement.")
    except engine.CrossingError as e:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=str(e))

    base_sentence = generate_interpretation(result)
    interpretation = enhance_with_ai(base_sentence, result) if payload.explain else base_sentence

    return CrossingRunResponse(**result, interpretation=interpretation)
