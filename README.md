# DATA LINK

Plateforme intelligente de visualisation, d'analyse, de croisement et de valorisation des données statistiques du Sénégal, basée sur les jeux de données ouvertes de l'ANSD (Agence Nationale de la Statistique et de la Démographie).

> « Connecter les données pour révéler l'information. »

Le cahier des charges complet du projet est disponible dans [`cahier_des_charges.pdf`](./cahier_des_charges.pdf).

## Stack technique

| Couche | Technologies |
|---|---|
| Frontend | React 19, TypeScript, Vite, Recharts, React Router |
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

python -m scripts.ingest     # charge les données d'amorçage
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

L'assistant est accessible :
- En **bulle flottante** (bouton 💬 en bas à droite) sur toutes les pages
- En **page dédiée** sur `/assistant`

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
| `GET` | `/api/v1/population` | Données population par région |
| `GET` | `/api/v1/indicators` | Indicateurs économiques/démographiques |
| `GET` | `/api/v1/health-establishments` | Établissements de santé |
| `GET` | `GET /api/v1/trade` | Flux commerciaux imports/exports |

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
- [x] API FastAPI avec endpoints données (catalogue, santé, commerce, population, indicateurs)
- [x] Assistant IA avec RAG (LangChain + Claude + ChromaDB)
- [x] Upload PDF avec ingestion automatique
- [x] Streaming des réponses en temps réel
- [x] Export CSV/Excel/JSON
- [ ] Moteur de croisement de données (RF-18 à RF-21)
- [ ] Authentification par rôle (RF-01, RNF-01)
- [ ] Cartographie interactive (RF-03)
- [ ] Interopérabilité SDMX (RF-16)

### Frontend
- [x] Navigation multi-pages (Accueil, Catalogue, 4 Dashboards)
- [x] Graphiques interactifs (Recharts)
- [x] ChatBot avec streaming, upload PDF, suggestions
- [x] Page dédiée Assistant IA (`/assistant`)
- [ ] Cartographie interactive (Leaflet/MapLibre)
- [ ] Comparaison régionale/temporelle
- [ ] Export PDF des rapports

### Données
- [x] 4 jeux de données référencés (santé, commerce, population, indicateurs)
- [x] Données réelles et sourcées (ANSD, MSAS, DG Trésor)
- [ ] Extension des sources (Open Data Sénégal, ANADS, Stats Sénégal)

## Équipe

Voir la section « Équipe projet et rôles » du cahier des charges pour la répartition des rôles.
