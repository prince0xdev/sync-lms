# SyncLearn

Plateforme e-learning avec formations, modules, pistes audio multilingues et suivi de progression. Le projet est en cours de développement.

## Démarrage local

Prérequis : Docker avec le plugin Compose.

```sh
cp -n .env.example .env
docker compose up --build
```

- Frontend : http://localhost:5173
- API et documentation OpenAPI : http://localhost:8000/docs
- PostgreSQL : localhost:5433
- MinIO : http://localhost:9000 (console : http://localhost:9001)

Pour arrêter les services, utilisez `docker compose down`. Les données persistent dans des volumes Docker. Pour repartir de zéro, `docker compose down -v` supprime aussi ces données.

Les valeurs de `.env.example` sont des identifiants de développement uniquement. Remplacez-les avant tout déploiement.

## État du produit

Le socle API, les modèles de données et l’authentification sont en cours. Le catalogue, la lecture et la progression restent à implémenter. Voir [le cahier des charges](docs/requirements.md) et [la spécification technique](docs/technical-specification.md).
