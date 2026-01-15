# Cuistot Family

Application web responsive de recettes de cuisine collaborative.

## Structure du projet

- `backend/` : API NestJS
- `frontend/` : Application Angular

## Prérequis

- Node.js (v22+)
- pnpm
- Docker & Docker Compose

## Installation et Lancement

### 1. Base de données (Docker)

À la racine du projet :
```bash
docker-compose up -d
```

### 2. Backend (NestJS)

```bash
cd backend
pnpm install
pnpm run start:dev
```

### 3. Frontend (Angular)

```bash
cd frontend
pnpm install
pnpm run start
```

## Technologies utilisées

- **Frontend** : Angular
- **Backend** : NestJS, TypeORM
- **Base de données** : PostgreSQL
- **DevOps** : Docker
