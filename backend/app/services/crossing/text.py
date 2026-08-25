"""Normalisation de noms (régions, pays...) pour faire correspondre les
valeurs de dimension entre jeux de données qui n'orthographient pas toujours
une zone de façon identique (accents, casse, tirets). Portage de la fonction
`normalize()` du frontend (frontend/src/components/SenegalMap.tsx) côté
backend, pour que le moteur de croisement et la carte utilisent exactement
la même règle de correspondance.
"""

import re
import unicodedata


def normalize_name(value: str) -> str:
    text = unicodedata.normalize("NFD", value)
    text = "".join(c for c in text if unicodedata.category(c) != "Mn")
    text = text.lower()
    text = text.replace("’", "'").replace("‘", "'")
    text = re.sub(r"[-–—]", " ", text)
    text = re.sub(r"\s+", " ", text).strip()
    return text
