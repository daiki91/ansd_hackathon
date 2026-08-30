"""Génération de la phrase d'interprétation (RF-21) à partir du résultat du
moteur de croisement. Toujours déterministe par défaut -- les chiffres et le
classement viennent uniquement du moteur (app/services/crossing/engine.py),
jamais d'un modèle de langage (voir cahier des charges §4.2.5 : "l'IA
explique et assiste, elle ne remplace pas le moteur statistique").

`enhance_with_ai` propose une reformulation optionnelle (paramètre
`explain=true` de l'API) qui ne touche qu'au style de la phrase, jamais aux
valeurs -- et retombe silencieusement sur la phrase déterministe si l'appel
échoue ou si aucune clé API n'est configurée.
"""

import logging

from app.core.config import get_settings
from app.services.crossing.recipes import RECIPES

logger = logging.getLogger(__name__)

_RECIPE_BY_SLUG = {r.slug: r for r in RECIPES}


def _format_value(value: float, unit: str) -> str:
    if abs(value) >= 100:
        text = f"{value:,.0f}".replace(",", " ")
    else:
        text = f"{value:,.2f}".replace(",", " ")
    return f"{text} {unit}".strip()


def generate_interpretation(result: dict) -> str:
    indicators = result.get("indicators") or []
    if not indicators:
        return "Aucun indicateur n'a pu être calculé pour ce croisement (aucune valeur commune)."

    primary = indicators[0]
    points = primary.get("points") or []
    if not points:
        return f"Aucune valeur exploitable pour l'indicateur « {primary['label']} »."

    top = points[0]
    label = primary["label"]
    unit = primary["unit"]
    unit_plural = "années" if result.get("dimension") == "year" else "zones"

    if primary.get("recipe_slug") and primary["recipe_slug"] in _RECIPE_BY_SLUG:
        verb = _RECIPE_BY_SLUG[primary["recipe_slug"]].interpretation_verb
        sentence = f"{top['zone']} {verb} ({_format_value(top['value'], unit)})."
    else:
        sentence = f"{top['zone']} a la valeur la plus élevée pour « {label} » ({_format_value(top['value'], unit)})."

    if len(points) >= 2:
        others = [p["value"] for p in points[1:]]
        avg_others = sum(others) / len(others)
        if avg_others > 0:
            ratio = top["value"] / avg_others
            if ratio >= 1.3:
                sentence += f" C'est {ratio:.1f} fois la moyenne des {len(others)} autres {unit_plural} comparées."

    correlations = result.get("correlations") or []
    for corr in correlations:
        r = corr.get("r")
        if r is not None and abs(r) >= 0.5 and corr.get("n", 0) >= 3:
            direction = "positive" if r > 0 else "négative"
            sentence += f" On observe une corrélation {direction} (r={r:.2f}) entre {corr['dataset_a']} et {corr['dataset_b']}."
            break

    distinct_years = {d["year"] for d in result.get("datasets", []) if d.get("year") is not None}
    if len(distinct_years) > 1:
        years_by_dataset = ", ".join(f"{d['label']} {d['year']}" for d in result.get("datasets", []) if d.get("year") is not None)
        sentence += f" Attention : les jeux de données croisés ne portent pas sur la même année ({years_by_dataset}) -- comparaison à interpréter avec prudence."

    return sentence


def enhance_with_ai(base_sentence: str, result: dict) -> str:
    settings = get_settings()
    if not settings.ANTHROPIC_API_KEY:
        return base_sentence

    try:
        from langchain_anthropic import ChatAnthropic

        llm = ChatAnthropic(
            model="claude-sonnet-4-20250514",  # même modèle que app/services/rag/pipeline.py
            temperature=0.3,
            max_tokens=200,
            anthropic_api_key=settings.ANTHROPIC_API_KEY,
        )
        response = llm.invoke(
            "Reformule la phrase suivante en français, de façon claire et naturelle pour un "
            "non-spécialiste, SANS changer ni ajouter aucun chiffre ni aucune zone géographique "
            f"mentionnée. Réponds uniquement avec la phrase reformulée.\n\nPhrase : {base_sentence}"
        )
        text = (response.content or "").strip() if isinstance(response.content, str) else str(response.content).strip()
        return text or base_sentence
    except Exception as e:  # noqa: BLE001 -- l'IA est un bonus, jamais bloquant
        logger.warning("enhance_with_ai a échoué, repli sur la phrase déterministe: %s", e)
        return base_sentence
