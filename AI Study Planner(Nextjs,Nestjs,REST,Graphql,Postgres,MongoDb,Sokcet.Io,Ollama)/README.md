# AI Study Planner

A full-stack study planning platform built with a microservices architecture.

- Frontend: Next.js 14 + React + Tailwind
- Backend: NestJS services (Gateway, Auth, Planner GraphQL, Progress, AI)
- Databases: PostgreSQL (auth + plans) and MongoDB (progress sessions)
- Realtime: Socket.IO via gateway proxy

## Monorepo Structure

```text
AI Study Planner/
  frontend/                  # Next.js app
  services/
    gateway-service/         # API gateway + reverse proxy
    auth-service/            # Auth + users (REST)
    planner-service/         # Study plans (GraphQL)
    progress-service/        # Progress tracking (REST + WebSocket)
    ai-service/              # AI endpoints (REST, Ollama-backed)
    shared-rest/             # Shared exception filter/types
  database/
    postgres/seeds/          # PostgreSQL schema + seed script
    mongodb/seeds/           # MongoDB seed script
```

## Architecture and Ports

Default local ports used by services:

- Frontend: `3000`
- Gateway: `4000` (recommended override; default code fallback is `3000`)
- Auth service: `3001`
- Planner service: `3002`
- Progress service: `3003`
- AI service: `3004`

Gateway route mapping:

- `/api/auth/*` -> Auth service
- `/graphql` -> Planner service
- `/api/progress/*` -> Progress service
- `/socket.io` -> Progress service (WebSocket)
- `/api/ai/*` -> AI service

## Prerequisites

- Node.js 18+
- npm 9+
- PostgreSQL running locally
- MongoDB running locally
- (Optional) Ollama running locally for AI responses

## Environment Setup

No `.env` files are committed, so create them manually.

### 1) Database seed env

Create `database/.env`:

```env
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=postgres
DB_NAME=study_planner
MONGO_URI=mongodb://localhost:27017/study_planner_sessions
```

### 2) Service env files

Create `services/auth-service/.env`:

```env
PORT=3001
CORS_ORIGIN=http://localhost:3000
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=postgres
DB_NAME=study_planner
JWT_SECRET=super_secret_jwt_key_change_in_production
```

Create `services/planner-service/.env`:

```env
PORT=3002
CORS_ORIGIN=http://localhost:3000
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=postgres
DB_NAME=study_planner
```

Create `services/progress-service/.env`:

```env
PORT=3003
CORS_ORIGIN=http://localhost:3000
MONGO_URI=mongodb://localhost:27017/study_planner_sessions
```

Create `services/ai-service/.env`:

```env
PORT=3004
CORS_ORIGIN=http://localhost:3000
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=llama3.2
```

Create `services/gateway-service/.env`:

```env
PORT=4000
CORS_ORIGIN=http://localhost:3000
AUTH_SERVICE_URL=http://localhost:3001
PLANNER_SERVICE_URL=http://localhost:3002
PROGRESS_SERVICE_URL=http://localhost:3003
AI_SERVICE_URL=http://localhost:3004
```

### 3) Frontend env file

Create `frontend/.env.local`:

```env
NEXT_PUBLIC_AUTH_API_URL=http://localhost:4000
NEXT_PUBLIC_PROGRESS_API_URL=http://localhost:4000
NEXT_PUBLIC_AI_API_URL=http://localhost:4000
NEXT_PUBLIC_PLANNER_GRAPHQL_URL=http://localhost:4000/graphql
NEXT_PUBLIC_WS_URL=http://localhost:4000
```

## Installation

From the repository root:

```bash
npm install
```

Optional (uses workspace script):

```bash
npm run install:all
```

## Seed Databases

From the repository root:

```bash
npm run seed
```

Or individually:

```bash
npm run seed:postgres
npm run seed:mongo
```

The seed scripts recreate database data.

## Run the Project

### Start all services + frontend

From the repository root:

```bash
npm run dev
```

This runs:

- Gateway
- Frontend
- Auth service
- Planner service
- Progress service
- AI service

### Start services individually

```bash
npm run dev:gateway
npm run dev:frontend
npm run dev:auth
npm run dev:planner
npm run dev:progress
npm run dev:ai
```

## Default Seeded Accounts

After running seed scripts:

- `alex@example.com` / `password123`
- `jane@example.com` / `password123`

## Main Endpoints

When gateway is running at `http://localhost:4000`:

- Health: `GET /health`
- Auth:
  - `POST /api/auth/register`
  - `POST /api/auth/login`
  - `GET /api/auth/profile` (Bearer token)
- Planner GraphQL: `POST /graphql`
- Progress:
  - `POST /api/progress`
  - `GET /api/progress/:userId`
  - `GET /api/progress/:userId/stats`
- AI:
  - `POST /api/ai/generate-plan`
  - `POST /api/ai/recommend`
- Socket.IO: `/socket.io`

## AI Service Notes

The AI service is configured for Ollama. If Ollama is unavailable, the service has local fallback responses for plan generation and recommendations.

To enable Ollama locally:

```bash
ollama serve
ollama pull llama3.2
```

## Troubleshooting

- Port conflict on `3000`: set gateway `PORT=4000` and keep frontend on `3000`.
- CORS issues: ensure every service has `CORS_ORIGIN=http://localhost:3000`.
- Auth token issues: verify `JWT_SECRET` exists in `services/auth-service/.env`.
- Planner/seed issues: verify PostgreSQL credentials in `database/.env` and service `.env` files match.
- Progress issues: verify MongoDB is running and `MONGO_URI` is valid.

## Tech Stack

- Next.js 14
- NestJS 10
- GraphQL (Apollo)
- TypeORM + PostgreSQL
- Mongoose + MongoDB
- Socket.IO
- Ollama (local LLM integration)
