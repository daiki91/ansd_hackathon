# DATA LINK

Plateforme intelligente de visualisation, d'analyse, de croisement et de valorisation des données statistiques du Sénégal, basée sur les jeux de données ouvertes de l'ANSD (Agence Nationale de la Statistique et de la Démographie).

> « Connecter les données pour révéler l'information. »

Le cahier des charges complet du projet (contexte, objectifs, exigences fonctionnelles et non fonctionnelles, architecture technique, cas d'usage) est disponible dans [`cahier_des_charges.pdf`](./cahier_des_charges.pdf) (source LaTeX : [`cahier_des_charges.tex`](./cahier_des_charges.tex)).

## Structure du dépôt

```
ansd_hackathon/
  cahier_des_charges.pdf   # spécifications complètes du projet
  cahier_des_charges.tex   # source LaTeX du cahier des charges
  backend/                 # API FastAPI (Python)
  frontend/                # application web React (Vite + TypeScript)
```

## Démarrage rapide

L'application se lance en deux serveurs séparés, à faire tourner en parallèle dans deux terminaux.

### Backend (FastAPI)

```bash
cd backend
python -m venv venv          # déjà fait si le dossier venv/ existe
# Windows : venv\Scripts\activate
# macOS/Linux : source venv/bin/activate
pip install -r requirements.txt

cp .env.example .env         # adapter au besoin
python -m scripts.ingest     # charge les données d'amorçage en base
uvicorn app.main:app --reload
```

API disponible sur `http://localhost:8000`, documentation interactive sur `http://localhost:8000/docs`. Détails complets : [`backend/README.md`](./backend/README.md).

### Frontend (React + Vite)

```bash
cd frontend
npm install
npm run dev
```

Application disponible sur `http://localhost:5173`, déjà configurée pour appeler le backend local (CORS et URL d'API préconfigurés).

## État d'avancement

### Backend

Squelette FastAPI fonctionnel, avec base de données Supabase (PostgreSQL) en cible et SQLite en développement local. Endpoints disponibles :

| Domaine | Route | Exigence couverte |
|---|---|---|
| Catalogue de données | `GET /api/v1/catalog`, `/{id}`, `/{id}/download` | RF-14, RF-17 |
| Santé | `GET /api/v1/health-establishments` | RF-02 |
| Commerce extérieur | `GET /api/v1/trade` | RF-02 |
| Population | `GET /api/v1/population` | RF-02 |
| Indicateurs (Économie, Population) | `GET /api/v1/indicators` | RF-13 |

Restent à implémenter : moteur de croisement (RF-18 à RF-21), recherche en langage naturel et assistant IA (RF-06, RF-07), cartographie interactive (RF-03), authentification par rôle (RF-01, RNF-01), interopérabilité SDMX (RF-16).

### Frontend

Application React avec navigation (Accueil, Catalogue de données, tableaux de bord Population / Économie / Santé / Commerce extérieur), connectée en direct à l'API backend, avec graphiques (Recharts) et export des jeux de données (CSV/Excel/JSON).

### Données

Les données intégrées sont **réelles et sourcées** (ANSD, Ministère de la Santé, Direction générale du Trésor français citant l'ANSD), mais encore partielles — voir la section « À propos des données » de [`backend/README.md`](./backend/README.md) pour le détail des sources utilisées, celles qui restent inaccessibles depuis cet environnement (Open Data for Africa, ANADS, Stats Sénégal), et comment les compléter.

## Équipe

Voir la section « Équipe projet et rôles » du cahier des charges pour la répartition des rôles (Backend/Data Engineer, Frontend, Data Scientist, Data Analyst/GIS, Product/UX).
