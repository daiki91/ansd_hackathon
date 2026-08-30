# DATA LINK

Plateforme intelligente de visualisation, d'analyse, de croisement et de valorisation des données statistiques du Sénégal, basée sur les jeux de données ouvertes de l'ANSD (Agence Nationale de la Statistique et de la Démographie).

> « Connecter les données pour révéler l'information. »

Le cahier des charges complet du projet est disponible dans [`cahier_des_charges.pdf`](./cahier_des_charges.pdf).

## Stack technique

| Couche | Technologies |
|---|---|
| Frontend | React 19, TypeScript, Vite, Tailwind CSS, shadcn/ui, Recharts, React Router |
| Cartographie | MapLibre GL JS (3D), limites administratives geoBoundaries, réseau transport OpenStreetMap |
| Backend | Python, FastAPI, SQLAlchemy, Pydantic |
| Base de données | SQLite (dev) / Supabase PostgreSQL + PostGIS (prod) |
| IA / RAG | LangChain, Anthropic Claude, ChromaDB, HuggingFace Embeddings |
| PDF Parsing | PyPDF (via LangChain) |
| Embeddings | all-MiniLM-L6-v2 (sentence-transformers, local, gratuit) |

## Structure du dépôt

```
ansd_hackathon/
  cahier_des_charges.pdf     # spécifications complètes du projet
  cahier_des_charges.tex     # source LaTeX du cahier des charges
  backend/                   # API FastAPI (Python)
    app/
      core/config.py         # configuration centralisée
      db/                    # session & base de données
      models/                # modèles SQLAlchemy
      routers/               # routes API (catalogue, données, chat)
      schemas/               # schémas Pydantic
      services/
        export.py            # export CSV/Excel/JSON
        rag/                 # module RAG (LangChain)
          pipeline.py        # ingestion, retrieval, génération
    scripts/ingest.py        # ingestion des données d'amorçage
    chroma_db/               # base vectorielle persistante
    data/                    # données sources (CSV)
  frontend/                  # application React (Vite + TypeScript)
    src/
      components/            # Layout, StatCard, ChatBot
      pages/                 # Accueil, Catalogue, Dashboards, Assistant
      api/                   # client HTTP, types TypeScript
```

## Démarrage rapide

L'application se lance en deux serveurs séparés.

### 0. Installation automatique des données (recommandé)

Un script unique récupère et construit **toutes les données officielles** du projet :

```bash
cd backend
python -m scripts.setup_data
```

Le pipeline (11 étapes, idempotent, ~2 min avec cache / ~10 min depuis zéro) :
1. Scraping du catalogue des publications ANSD ([ansd.sn](https://www.ansd.sn/toutes-les-publications))
2. Téléchargement des ~82 fichiers XLSX officiels (~35 Mo, sources primaires)
3. Construction des CSV structurés avec **validation automatique** (les sommes régionales doivent correspondre aux totaux officiels, sinon le script échoue) :
   - Population RGPH-5 2023 exacte + projections ANSD 2023-2050 (14 régions + 46 départements)
   - Établissements de santé par région (DPRS/MSAS, tableau F.04.03)
   - PIB régional volume/valeur + structure sectorielle (comptes régionaux ANSD 2020-2023)
   - Commerce extérieur par partenaire (séries DGIT 2010-2026)
   - Inflation IHPC officielle calculée depuis l'indice base 2023
4. Réseau de transport OpenStreetMap → GeoJSON pour la carte (routes A1-N11, voies ferrées dont le TER, ports, aéroports)
5. Ingestion de tous les CSV vers la base SQLite

> Principe « temps réel » : le RGPH-5 (2023) étant le dernier recensement, les projections
> officielles 2023-2050 font foi jusqu'au prochain recensement. Le bouton
> « Actualiser » de la carte re-tente les sources distantes puis retombe sur le cache local.

### 1. Backend (FastAPI)

```bash
cd backend
python -m venv venv
# Windows : venv\Scripts\activate
# macOS/Linux : source venv/bin/activate
pip install -r requirements.txt

cp .env.example .env
# Ajouter votre clé API Anthropic dans .env :
# ANTHROPIC_API_KEY=sk-ant-xxxxx

python -m scripts.setup_data    # données complètes (ou : python -m scripts.ingest pour l'amorçage minimal)
python -m scripts.ingest_rag    # ingestion des CSV dans la base vectorielle (chatbot)
uvicorn app.main:app --reload
```

API sur `http://localhost:8000` — documentation interactive sur `http://localhost:8000/docs`.

### 2. Frontend (React + Vite)

```bash
cd frontend
npm install
npm run dev
```

Application sur `http://localhost:5173`.

### 3. Assistant IA

L'assistant est accessible en **page dédiée** sur `/assistant`.

Pour enrichir la base de connaissances, uploadez des PDFs directement depuis le chat ou via l'API :

```bash
# Upload d'un PDF
curl -X POST http://localhost:8000/api/v1/chat/ingest/pdf \
  -F "file=@rapport_ansd_2024.pdf" \
  -F "source_name=ANSD Rapport 2024"

# Ingestion de texte brut
curl -X POST http://localhost:8000/api/v1/chat/ingest \
  -H "Content-Type: application/json" \
  -d '{"text": "La population du Sénégal est de 18.126.390 habitants...", "source_name": "RGPH-5"}'
```

## Endpoints API

### Données

| Méthode | Route | Description |
|---|---|---|
| `GET` | `/api/v1/catalog` | Liste des jeux de données |
| `GET` | `/api/v1/catalog/{id}` | Détail d'un jeu de données |
| `GET` | `/api/v1/catalog/{id}/download` | Téléchargement CSV/Excel/JSON |
| `GET` | `/api/v1/population` | Population par région (RGPH-5 2023) |
| `GET` | `/api/v1/population/projections` | Projections ANSD 2023-2050 (`level=regions\|departements`) |
| `GET` | `/api/v1/regional-gdp` | PIB régional + structure sectorielle (2020-2023) |
| `GET` | `/api/v1/indicators` | Indicateurs économiques/démographiques (inflation IHPC) |
| `GET` | `/api/v1/health-establishments` | Établissements de santé par région |
| `GET` | `/api/v1/trade` | Flux commerciaux imports/exports par pays (2010-2025) |
| `GET` | `/api/v1/geo/regions` | 14 régions (centres, population) |
| `GET` | `/api/v1/geo/departments` | 45 départements (centres) |
| `GET` | `/api/v1/geo/sources` | Portails de données officiels |
| `GET` | `/api/v1/data/refresh` | Re-fetch des sources officielles (fallback cache local) |
| `GET` | `/api/v1/data/freshness` | Fraîcheur des données par domaine (live / local_cache) |

### Assistant IA (RAG)

| Méthode | Route | Description |
|---|---|---|
| `POST` | `/api/v1/chat` | Poser une question (réponse complète) |
| `POST` | `/api/v1/chat/stream` | Poser une question (streaming SSE) |
| `POST` | `/api/v1/chat/ingest` | Ingestion de texte brut |
| `POST` | `/api/v1/chat/ingest/pdf` | Upload et ingestion d'un PDF |
| `GET` | `/api/v1/chat/stats` | Statistiques de la base vectorielle |

## Architecture RAG

```
PDF/Texte
  ↓ PyPDFLoader (LangChain)
Extraction du texte
  ↓ RecursiveCharacterTextSplitter (1000 chars, overlap 200)
Découpage en chunks
  ↓ HuggingFace Embeddings (all-MiniLM-L6-v2)
Vecteurs 384 dimensions
  ↓ ChromaDB (FAISS en interne)
Base vectorielle persistante
  ↓ Retriever (cosine similarity, top-k)
Chunks pertinents
  ↓ ChatPromptTemplate + Claude (claude-sonnet-4-20250514)
Réponse contextuelle et sourcée
```

## État d'avancement

### Backend
- [x] API FastAPI avec endpoints données (catalogue, santé, commerce, population, indicateurs, PIB régional)
- [x] Pipeline d'installation automatique des données officielles (`python -m scripts.setup_data`)
- [x] Projections démographiques ANSD 2023-2050 (régions + départements)
- [x] Assistant IA avec RAG (LangChain + Claude + ChromaDB)
- [x] Upload PDF avec ingestion automatique
- [x] Streaming des réponses en temps réel
- [x] Export CSV/Excel/JSON
- [ ] Moteur de croisement serveur (RF-18 à RF-21 — croisement client déjà opérationnel sur la carte)
- [ ] Authentification par rôle (RF-01, RNF-01)
- [ ] Interopérabilité SDMX (RF-16)

### Frontend
- [x] Navigation multi-pages (Accueil, Catalogue, 4 Dashboards)
- [x] Carte 3D interactive MapLibre (limites réelles geoBoundaries, régions + départements)
- [x] Couches statistiques : Population / Santé / PIB / Indicateurs + sélecteur d'année 2023-2050
- [x] Réseau de transport superposable : routes (A1-N11), rails (TER), ports, aéroports
- [x] Comparaison croisée multi-indicateurs (jusqu'à 4 zones × 4 domaines)
- [x] Graphiques interactifs (Recharts)
- [ ] Export PDF des rapports

### Données
- [x] Sources 100 % officielles et sourcées : ANSD (RGPH-5, projections, comptes régionaux, commerce DGIT, IHPC), MSAS/DPRS
- [x] Validation automatique de cohérence dans les scripts d'extraction
- [x] Catalogue de 82 publications XLSX ANSD téléchargeables (`data/raw/ansd_publications.json`)
- [ ] Extension des sources (Open Data Sénégal CKAN — tenté en direct, portails Knoema bloqués en API)

## Équipe

Voir la section « Équipe projet et rôles » du cahier des charges pour la répartition des rôles.
