# DATA LINK -- Backend (FastAPI)

Squelette de l'API backend du projet **DATA LINK**, conforme au cahier des
charges (`cahier_des_charges.tex` / `.pdf` à la racine du dépôt) : stack
Python/FastAPI, base de données Supabase (PostgreSQL) en cible, SQLite en
développement local.

## Démarrage rapide

```bash
cd backend
python -m venv venv          # déjà fait si le dossier venv/ existe
# Windows : venv\Scripts\activate
# macOS/Linux : source venv/bin/activate
pip install -r requirements.txt

cp .env.example .env         # adapter au besoin (voir commentaires du fichier)

python -m scripts.ingest     # charge les données d'amorçage en base
uvicorn app.main:app --reload
```

L'API est alors disponible sur `http://localhost:8000`, avec documentation
interactive auto-générée (RF-17) sur :

- `http://localhost:8000/docs` (Swagger UI)
- `http://localhost:8000/redoc` (ReDoc)

Le frontend (Vite, `http://localhost:5173` par défaut) est déjà autorisé côté
CORS (`CORS_ORIGINS` dans `.env.example`).

## Structure du projet

```
backend/
  app/
    core/       # configuration (.env) et sécurité (clé API)
    db/         # connexion SQLAlchemy (Supabase/PostgreSQL ou SQLite local)
    models/     # modèles ORM (catalogue, santé, commerce extérieur, population, indicateurs)
    schemas/    # schémas Pydantic (réponses API)
    routers/    # endpoints FastAPI, groupés par domaine
    services/   # logique réutilisable (export CSV/Excel/JSON)
    main.py     # point d'entrée FastAPI
  data/raw/     # jeux de données bruts (CSV) utilisés par le script d'ingestion
  scripts/
    ingest.py   # charge data/raw/*.csv dans la base
  tests/        # tests API (pytest + SQLite en mémoire)
```

## Endpoints disponibles (v0)

| Méthode | Route                                       | Exigence couverte |
|---------|----------------------------------------------|--------------------|
| GET     | `/health`                                     | supervision        |
| GET     | `/api/v1/catalog`                             | RF-14, RF-17        |
| GET     | `/api/v1/catalog/{id}`                        | RF-14, RF-17        |
| GET     | `/api/v1/catalog/{id}/download?format=csv\|excel\|json` | RF-14  |
| GET     | `/api/v1/health-establishments`               | RF-02, RF-18–21 (domaine Santé) |
| GET     | `/api/v1/trade`                               | RF-02 (domaine Commerce extérieur) |
| GET     | `/api/v1/population`                          | RF-02 (domaine Population, base de croisement) |
| GET     | `/api/v1/indicators`                          | RF-13 (indicateurs dynamiques Économie/Population) |

Ces routes constituent la fondation à partir de laquelle brancher les
fonctionnalités suivantes (tableaux de bord détaillés, cartographie,
recherche en langage naturel, assistant IA, moteur de croisement, etc.),
listées dans le cahier des charges.

## ⚠️ À propos des données

Plusieurs portails de données ANSD ont été essayés pour amorcer la base avec
des données réelles. Statut de chaque source :

| Source | Statut | Raison |
|---|---|---|
| [Open Data for Africa](https://senegal.opendataforafrica.org/) | ❌ Non automatisable | Export CSV/Excel/SDMX derrière un bouton rendu en JavaScript, pas d'endpoint public de téléchargement direct. |
| [ANADS](https://anads.ansd.sn/) (catalogue NADA/IHSN, +200 enquêtes) | ❌ Inaccessible | Certificat SSL du serveur invalide (chaîne de certification incomplète) -- bloqué côté serveur ANSD, indépendamment de la méthode utilisée. |
| [Stats Sénégal](https://www.statsenegal.sn/) (portail du Système Statistique National) | ❌ Inaccessible | Même problème de certificat SSL que ANADS. |
| [Site officiel ANSD](https://www.ansd.sn/) | ⚠️ Partiel | Pas d'API, mais les pages de contenu (annuaire, actualités, notes de presse) sont lisibles -- utilisées pour sourcer les données ci-dessous. |
| Sources tierces citant l'ANSD (presse, DG Trésor français, ambassades) | ✅ Utilisées | Pages HTML standards, accessibles, citant explicitement les chiffres et publications officielles de l'ANSD. |

Pour ne pas bloquer le démarrage du code sur ces contraintes, `data/raw/`
contient des jeux de données d'amorçage **réels et sourcés** (aucun chiffre
inventé), mais volontairement partiels :

- `etablissements_sante.csv` -- chiffres nationaux 2022 et régionaux 2017
  (ANSD/MSAS, via des articles de presse citant ces sources officielles).
- `commerce_exterieur.csv` -- chiffres du commerce extérieur 2023 (source
  ANSD, via la Direction générale du Trésor français).
- `population.csv` -- population totale et 3 principales régions, RGPH-5
  2023 (ANSD, note de presse officielle du 31/10/2023).
- `indicateurs_nationaux.csv` -- croissance du PIB, inflation, dette
  publique (2020-2024) et indicateurs démographiques du RGPH-5 (source ANSD
  via la Direction générale du Trésor français).

Chaque fichier documente sa source en en-tête. **Prochaine étape recommandée**
si l'équipe veut des données plus complètes : quelqu'un ayant accès à un
navigateur (donc pas contraint par les mêmes blocages réseau que cet agent)
peut (1) exporter manuellement les jeux de données complets depuis Open Data
for Africa (liens dans `scripts/ingest.py`), et/ou (2) réessayer ANADS et
Stats Sénégal -- leur souci de certificat SSL est peut-être ponctuel ou lié à
un outillage particulier. Une fois les fichiers récupérés, remplacer
`data/raw/*.csv` en conservant les mêmes noms de colonnes -- le script
d'ingestion et l'API n'ont alors besoin d'aucune modification.

## Prochaines étapes suggérées

- Brancher un vrai projet Supabase (`DATABASE_URL` dans `.env`) et activer
  l'extension PostGIS pour les données géographiques (cartographie -- RF-03).
- Remplacer `Base.metadata.create_all` par des migrations Alembic une fois le
  schéma plus stable.
- Ajouter l'authentification par rôle (RF-01, RNF-01) et activer
  `REQUIRE_API_KEY=true` avant toute exposition publique.
- Implémenter le moteur de croisement (RF-18 à RF-21) au-dessus des tables de
  données existantes.
