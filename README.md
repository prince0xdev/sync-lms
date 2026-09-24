# SyncLearn

Plateforme e-learning avec formations, modules, pistes audio multilingues et suivi de progression. Le projet est en cours de développement.

## Démarrage local

Prérequis : Docker avec le plugin Compose.

```sh
cp -n .env.example .env
pnpm dev
```

La première exécution construit les images qui manquent. Ensuite, `pnpm dev` redémarre les services sans forcer leur reconstruction. Le code de l’API est monté dans le conteneur et Uvicorn recharge l’API quand un fichier Python change. Le frontend utilise Vite et recharge la page pendant le développement.

Pour démarrer seulement l’API avec PostgreSQL et MinIO :

```sh
pnpm dev:api
```

Utilisez `pnpm dev:build` après une modification du `Dockerfile` ou des dépendances Python/Node. Les changements dans le code source n’ont pas besoin d’un rebuild. L’API est disponible sur http://localhost:8000/docs.

Si les conteneurs existent déjà et que le frontend signale une dépendance manquante après la mise à jour du dépôt, synchronisez une fois le volume Node avec `docker compose run --rm --no-deps web pnpm install --frozen-lockfile`, puis relancez `pnpm dev`.

- Frontend : http://localhost:5173
- API et documentation OpenAPI : http://localhost:8000/docs
- PostgreSQL : localhost:5433
- MinIO : http://localhost:9000 (console : http://localhost:9001)

Pour arrêter les services, utilisez `docker compose down`. Les données persistent dans des volumes Docker. Pour repartir de zéro, `docker compose down -v` supprime aussi ces données.

Les valeurs de `.env.example` sont des identifiants de développement uniquement. Remplacez-les avant tout déploiement.

## Administration

Définissez `ADMIN_EMAILS` dans `.env` avec une ou plusieurs adresses séparées par des virgules. Inscrivez le premier compte avec l’une de ces adresses (ou reconnectez-vous si le compte existe déjà), puis ouvrez `/fr/admin` ou `/en/admin`. Les opérations d’administration sont protégées par l’API, indépendamment de l’interface.

## État du produit

Le socle Docker, l’authentification, le catalogue, les inscriptions, l’accès aux modules et les routes de progression sont présents. L’interface comprend aussi le lecteur multilingue, la reprise de lecture, la validation des modules, la navigation au module suivant et le tableau de bord. La couverture automatisée, la documentation du cycle de livraison et un déploiement public restent à finaliser. Voir [le cahier des charges](docs/requirements.md) et [la spécification technique](docs/technical-specification.md).
