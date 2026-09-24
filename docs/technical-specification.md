# Spécification technique

## Objectif

SyncLearn permet de découvrir des formations, suivre leurs modules et consulter sa progression.

## Architecture

- Interface : React, TypeScript et Vite.
- API : FastAPI et Pydantic.
- Données : PostgreSQL, SQLAlchemy et migrations Alembic.
- Fichiers audio et vidéo : MinIO.
- Lancement local : Docker Compose.

L’API porte les règles métier et reste la source de vérité pour les inscriptions et la progression. PostgreSQL conserve les métadonnées ; les fichiers médias restent dans MinIO.

## Modèle de données

`User` s’inscrit à des `Course`. Une formation contient des `Module`, chaque module peut avoir plusieurs `AudioTrack`, et `ModuleProgress` suit l’avancement d’un utilisateur. Les contraintes uniques empêchent les inscriptions et progressions en double.

## Ordre de réalisation

1. Socle Docker et persistance.
2. Authentification et gestion de session.
3. Catalogue, détails et inscriptions.
4. Lecture, choix de langue et progression.
5. Tableau de bord.
6. Tests, documentation et déploiement.

Les fonctions bonus seront traitées après le parcours principal.
