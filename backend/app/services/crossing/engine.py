"""Moteur de croisement DATA LINK (RF-18 à RF-20).

Détecte automatiquement la dimension commune entre N jeux de données
sélectionnés, les joint sur cette dimension, et calcule pour chaque paire de
mesures un indicateur -- nommé selon une recette sémantique reconnue quand il
y en a une (app/services/crossing/recipes.py), sinon un ratio générique --
ainsi qu'un classement et, quand pertinent, une corrélation.
"""

from itertools import combinations

from sqlalchemy.orm import Session

from app.services.crossing.adapters import ADAPTERS, detect_common_dimensions, get_adapter
from app.services.crossing.recipes import find_recipe


class CrossingError(ValueError):
    """Erreur métier du moteur de croisement (traduite en 422 par le routeur)."""


def _pearson(xs: list[float], ys: list[float]) -> float | None:
    n = len(xs)
    if n < 3:
        return None
    mean_x, mean_y = sum(xs) / n, sum(ys) / n
    cov = sum((x - mean_x) * (y - mean_y) for x, y in zip(xs, ys))
    var_x = sum((x - mean_x) ** 2 for x in xs)
    var_y = sum((y - mean_y) ** 2 for y in ys)
    if var_x == 0 or var_y == 0:
        return None
    return cov / (var_x**0.5 * var_y**0.5)


def cross(
    db: Session,
    dataset_ids: list[str],
    measures: dict[str, str] | None = None,
    dimension: str | None = None,
    year: int | None = None,
) -> dict:
    if len(dataset_ids) < 2:
        raise CrossingError("Il faut au moins 2 jeux de données pour un croisement.")

    for did in dataset_ids:
        if did not in ADAPTERS:
            raise KeyError(did)

    adapters = [get_adapter(did) for did in dataset_ids]
    measures = measures or {}
    chosen_measures = {a.dataset_id: measures.get(a.dataset_id, a.default_measure()) for a in adapters}
    for a in adapters:
        m = chosen_measures[a.dataset_id]
        if m not in a.measures:
            raise CrossingError(f"Mesure '{m}' inconnue pour le jeu de données '{a.dataset_id}'.")

    common_dims = detect_common_dimensions(dataset_ids)
    if not common_dims:
        raise CrossingError(
            f"Aucune dimension commune entre {', '.join(dataset_ids)} -- ces jeux de données ne peuvent pas être croisés."
        )
    if dimension is not None and dimension not in common_dims:
        raise CrossingError(
            f"Dimension '{dimension}' non commune à {', '.join(dataset_ids)} (dimensions communes : {', '.join(common_dims)})."
        )
    chosen_dimension = dimension or common_dims[0]

    tables: dict[str, dict[str, float]] = {}
    display_names: dict[str, str] = {}
    years_used: dict[str, int | None] = {}
    for a in adapters:
        table, eff_year, names = a.load_dimension_table(db, chosen_dimension, chosen_measures[a.dataset_id], year)
        tables[a.dataset_id] = table
        years_used[a.dataset_id] = eff_year if chosen_dimension != "year" else None
        for key, raw_name in names.items():
            # Préfère un libellé accentué (ex. "Kédougou") à un équivalent sans accent
            # ("Kedougou") venant d'un autre jeu de données -- les deux désignent la
            # même zone une fois normalisés, seul l'affichage doit être tranché.
            current = display_names.get(key)
            if current is None or (not any(ord(c) > 127 for c in current) and any(ord(c) > 127 for c in raw_name)):
                display_names[key] = raw_name

    # "year" au niveau racine n'a de sens que si tous les jeux de données
    # utilisent la même année de référence -- sinon on l'expose seulement par
    # dataset (voir DatasetRef.year) pour ne jamais suggérer à tort que des
    # données de millésimes différents partagent une même année (RNF-08/09).
    distinct_years = {y for y in years_used.values() if y is not None}
    effective_year = distinct_years.pop() if len(distinct_years) == 1 else None

    # Jointure interne : uniquement les valeurs de dimension présentes dans TOUS les jeux sélectionnés.
    common_keys = set(tables[adapters[0].dataset_id].keys())
    for a in adapters[1:]:
        common_keys &= set(tables[a.dataset_id].keys())

    joined_table: dict[str, dict[str, float]] = {}
    for key in common_keys:
        zone_label = display_names.get(key, key)
        joined_table[zone_label] = {a.dataset_id: tables[a.dataset_id][key] for a in adapters}

    datasets_ref = [
        {
            "dataset_id": a.dataset_id,
            "label": a.label,
            "measure_column": chosen_measures[a.dataset_id],
            "measure_label": a.measures[chosen_measures[a.dataset_id]].label,
            "unit": a.measures[chosen_measures[a.dataset_id]].unit,
            "source": a.source,
            "year": years_used[a.dataset_id],
        }
        for a in adapters
    ]

    adapter_by_id = {a.dataset_id: a for a in adapters}
    indicators: list[dict] = []
    correlations: list[dict] = []

    for a_ds, b_ds in combinations(dataset_ids, 2):
        a_measure = adapter_by_id[a_ds].measures[chosen_measures[a_ds]]
        b_measure = adapter_by_id[b_ds].measures[chosen_measures[b_ds]]

        pairs = [
            (zone, vals[a_ds], vals[b_ds])
            for zone, vals in joined_table.items()
            if vals.get(a_ds) is not None and vals.get(b_ds) is not None
        ]
        if not pairs:
            continue

        recipe_match = find_recipe(a_measure.kind, b_measure.kind)
        if recipe_match:
            recipe, swapped = recipe_match
            num_ds, den_ds = (b_ds, a_ds) if swapped else (a_ds, b_ds)
            points = []
            for zone, val_a, val_b in pairs:
                num_val = val_b if swapped else val_a
                den_val = val_a if swapped else val_b
                computed = recipe.compute(num_val, den_val)
                if computed is not None:
                    points.append({"zone": zone, "value": round(computed, 4)})
            points.sort(key=lambda p: p["value"], reverse=True)
            indicators.append({
                "recipe_slug": recipe.slug,
                "label": recipe.label,
                "unit": recipe.unit,
                "numerator_dataset": num_ds,
                "denominator_dataset": den_ds,
                "points": points,
            })
        else:
            points = []
            for zone, val_a, val_b in pairs:
                if val_b == 0:
                    continue
                points.append({"zone": zone, "value": round(val_a / val_b, 4)})
            points.sort(key=lambda p: p["value"], reverse=True)
            indicators.append({
                "recipe_slug": None,
                "label": f"Ratio {a_measure.label} / {b_measure.label}",
                "unit": f"{a_measure.unit}/{b_measure.unit}" if b_measure.unit else a_measure.unit,
                "numerator_dataset": a_ds,
                "denominator_dataset": b_ds,
                "points": points,
            })

        xs = [p[1] for p in pairs]
        ys = [p[2] for p in pairs]
        r = _pearson(xs, ys)
        correlations.append({"dataset_a": a_ds, "dataset_b": b_ds, "r": round(r, 3) if r is not None else None, "n": len(pairs)})

    sources = sorted({a.source for a in adapters})

    return {
        "dataset_ids": dataset_ids,
        "dimension": chosen_dimension,
        "year": effective_year,
        "datasets": datasets_ref,
        "joined_table": joined_table,
        "indicators": indicators,
        "correlations": correlations,
        "sources": sources,
    }
