"""Couche sémantique du moteur de croisement : reconnaît des combinaisons de
types de mesures (`MeasureSpec.kind`) et sait quelle opération métier en
tirer, plutôt que de se contenter d'un ratio générique aveugle.

Exemple qui a motivé cette couche : croiser Population et Superficie doit
produire une "densité de population" (population / superficie), pas un
"ratio A/B" sans nom -- et dans le bon sens (population au numérateur).

Ajouter une nouvelle combinaison reconnue = ajouter une entrée à RECIPES,
sans toucher au cœur du moteur (app/services/crossing/engine.py).
"""

from dataclasses import dataclass
from typing import Literal

Formula = Literal["ratio", "share"]


@dataclass(frozen=True)
class Recipe:
    slug: str
    label: str
    numerator_kind: str
    denominator_kind: str
    unit: str
    formula: Formula
    interpretation_verb: str
    """Verbe/expression utilisé dans la phrase d'interprétation générée,
    ex. "a la densité de population la plus élevée"."""

    def compute(self, numerator: float, denominator: float) -> float | None:
        if denominator in (0, None):
            return None
        if self.formula == "share":
            if numerator + denominator == 0:
                return None
            return numerator / (numerator + denominator) * 100
        return numerator / denominator


RECIPES: list[Recipe] = [
    Recipe(
        slug="densite_population",
        label="Densité de population",
        numerator_kind="population_count",
        denominator_kind="area_km2",
        unit="hab./km²",
        formula="ratio",
        interpretation_verb="a la densité de population la plus élevée",
    ),
    Recipe(
        slug="population_par_etablissement",
        label="Population moyenne par établissement de santé",
        numerator_kind="population_count",
        denominator_kind="facility_count",
        unit="hab./établissement",
        formula="ratio",
        interpretation_verb="a le ratio population/établissement de santé le plus élevé",
    ),
    Recipe(
        slug="pib_par_habitant",
        label="PIB par habitant",
        numerator_kind="gdp_value",
        denominator_kind="population_count",
        unit="Mds FCFA/hab.",
        formula="ratio",
        interpretation_verb="a le PIB par habitant le plus élevé",
    ),
    Recipe(
        slug="dependance_importations_cereales",
        label="Taux de dépendance aux importations de céréales",
        numerator_kind="import_volume_tonnes",
        denominator_kind="production_volume_tonnes",
        unit="%",
        formula="share",
        interpretation_verb="présente le taux de dépendance aux importations le plus élevé",
    ),
]

_BY_KIND: dict[tuple[str, str], Recipe] = {(r.numerator_kind, r.denominator_kind): r for r in RECIPES}


def find_recipe(kind_a: str, kind_b: str) -> tuple[Recipe, bool] | None:
    """Cherche une recette pour la paire de kinds (kind_a, kind_b), dans les
    deux sens. Le booléen indique si l'ordre (a, b) a dû être inversé pour
    correspondre au sens numérateur/dénominateur de la recette -- l'appelant
    doit alors permuter numérateur et dénominateur en conséquence."""

    if (kind_a, kind_b) in _BY_KIND:
        return _BY_KIND[(kind_a, kind_b)], False
    if (kind_b, kind_a) in _BY_KIND:
        return _BY_KIND[(kind_b, kind_a)], True
    return None
