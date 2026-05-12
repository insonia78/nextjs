# Real-Time Collaboration Platform

A full-stack, microservices-based collaboration platform enabling teams to communicate in real time, collaborate on documents, manage tasks, and receive live notifications.

---

## Table of Contents

- [Overview](#overview)
- [Architecture](#architecture)
- [Tech Stack](#tech-stack)
- [Services](#services)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [API Endpoints](#api-endpoints)
- [Project Structure](#project-structure)

---

## Overview

This platform provides:

- **Authentication & Teams** — JWT-based auth with role-based access control (Admin, Member, Guest)
- **Real-time Chat** — Channel-based messaging (Text, Voice, DM) with GraphQL subscriptions and WebSockets
- **Collaborative Documents** — CRDT-based real-time document editing with cursor tracking via Yjs and TipTap
- **Task Management** — GraphQL-powered task and document management per team
- **Notifications** — Live event notifications delivered over WebSockets with Redis pub/sub

---

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                        Frontend                         │
│              Next.js 14 · Apollo · Socket.io            │
└────────────────────────┬────────────────────────────────┘
                         │ HTTP / WS
                         ▼
┌─────────────────────────────────────────────────────────┐
│                    API Gateway :4000                    │
│                  NestJS · HTTP Proxy                    │
└──────┬──────────┬──────────┬──────────┬────────────────┘
       │          │          │          │
  :4001      :4002      :4003      :4004
  Auth      Chat       Task    Notification
 Service   Service    Service    Service
       │          │          │          │
       └──────────┴──────────┴──────────┘
                         │
              ┌──────────┴──────────┐
              │                     │
         PostgreSQL 15           Redis 7
           :5432                 :6379
```

All backend services are NestJS microservices. Each service owns its own database schema within the shared PostgreSQL instance. Redis is used for pub/sub messaging and real-time presence.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 14, React 18, Zustand, Apollo Client |
| Collaborative Editing | Yjs, y-websocket, TipTap |
| Real-time | Socket.io, graphql-ws |
| Backend | NestJS, Passport, JWT |
| API | REST (Auth/Gateway), GraphQL (Chat/Task) |
| Database | PostgreSQL 15 with Prisma ORM |
| Caching / Pub-Sub | Redis 7 |
| Containerization | Docker, Docker Compose |

---

## Services

### API Gateway — port `4000`
Routes all incoming requests to the appropriate backend service. Exposes a `/health` endpoint for liveness checks.

### Auth Service — port `4001`
Handles user registration, login, JWT issuance and verification, and team management. Roles: `ADMIN`, `MEMBER`, `GUEST`.

### Chat Service — port `4002`
Manages channels and messages via GraphQL. Provides real-time messaging through Socket.io and GraphQL subscriptions (`graphql-ws`). Tracks user presence via Redis.

### Task Service — port `4003`
GraphQL API for task creation, updates, and collaborative document management per team/workspace.

### Notification Service — port `4004`
Listens to Redis events and broadcasts notifications to connected clients via WebSocket. Stateless — no dedicated database.

### Frontend — port `3000`
Next.js application with:
- Zustand stores for per-domain state (auth, chat, tasks, notifications)
- Apollo Client for GraphQL queries and subscriptions
- Socket.io client for live chat and notifications
- TipTap + Yjs for collaborative rich-text editing

---

## Getting Started

### Prerequisites

- [Docker](https://www.docker.com/) and Docker Compose
- Node.js 18+ (for local development without Docker)

### Run with Docker

```bash
# Clone the repository
git clone <repository-url>
cd "Real-Time Collaboration Platform"

# Start all services
docker compose up --build
```

Services will be available at:

| Service | URL |
|---|---|
| Frontend | http://localhost:3000 |
| API Gateway | http://localhost:4000 |
| Auth Service | http://localhost:4001 |
| Chat Service (GraphQL) | http://localhost:4002/graphql |
| Task Service (GraphQL) | http://localhost:4003/graphql |
| Notification Service | http://localhost:4004 |

### Local Development (without Docker)

Each service can be run independently. From the service directory:

```bash
# Install dependencies
npm install

# Run database migrations
npx prisma db push

# Start in development mode
npm run start:dev
```

---

## Environment Variables

> **Warning:** The default secrets below are for local development only. Replace all secrets before deploying to any environment.

### Auth Service

| Variable | Default | Description |
|---|---|---|
| `DATABASE_URL` | `postgresql://collab:collab_pass@postgres:5432/collab_db?schema=auth` | PostgreSQL connection string |
| `JWT_SECRET` | `super_secret_jwt_key_change_in_production` | JWT signing secret |
| `JWT_EXPIRES_IN` | `7d` | Token expiration duration |
| `PORT` | `4001` | Service port |

### Chat Service

| Variable | Default | Description |
|---|---|---|
| `DATABASE_URL` | `postgresql://collab:collab_pass@postgres:5432/collab_db?schema=chat` | PostgreSQL connection string |
| `REDIS_URL` | `redis://redis:6379` | Redis connection string |
| `PORT` | `4002` | Service port |

### Task Service

| Variable | Default | Description |
|---|---|---|
| `DATABASE_URL` | `postgresql://collab:collab_pass@postgres:5432/collab_db?schema=task` | PostgreSQL connection string |
| `PORT` | `4003` | Service port |

### Notification Service

| Variable | Default | Description |
|---|---|---|
| `REDIS_URL` | `redis://redis:6379` | Redis connection string |
| `PORT` | `4004` | Service port |

### API Gateway

| Variable | Default | Description |
|---|---|---|
| `AUTH_SERVICE_URL` | `http://auth-service:4001` | Auth service base URL |
| `CHAT_SERVICE_URL` | `http://chat-service:4002` | Chat service base URL |
| `TASK_SERVICE_URL` | `http://task-service:4003` | Task service base URL |
| `NOTIFICATION_SERVICE_URL` | `http://notification-service:4004` | Notification service base URL |
| `PORT` | `4000` | Gateway port |

### Frontend

| Variable | Default | Description |
|---|---|---|
| `NEXT_PUBLIC_GATEWAY_URL` | `http://localhost:4000` | Gateway base URL |
| `NEXT_PUBLIC_WS_URL` | `ws://localhost:4002` | WebSocket URL for chat |

---

## API Endpoints

### Auth Service (REST)

| Method | Path | Description |
|---|---|---|
| `POST` | `/auth/register` | Register a new user |
| `POST` | `/auth/login` | Login and receive JWT |
| `GET` | `/auth/verify` | Verify a JWT token |
| `GET` | `/users/me` | Get current user profile |
| `GET` | `/teams` | List teams |
| `POST` | `/teams` | Create a team |

### Chat Service (GraphQL — `/graphql`)

Key operations:

- **Queries:** `channels`, `messages`
- **Mutations:** `createChannel`, `sendMessage`
- **Subscriptions:** `messageAdded`, `presenceUpdated`

### Task Service (GraphQL — `/graphql`)

Key operations:

- **Queries:** `tasks`, `documents`
- **Mutations:** `createTask`, `updateTask`, `createDocument`

---

## Project Structure

```
.
├── docker-compose.yml
├── backend/
│   ├── auth-service/        # JWT auth, users, teams
│   ├── chat-service/        # Channels, messages, presence
│   ├── task-service/        # Tasks, collaborative documents
│   ├── notification-service # Real-time notifications
│   └── gateway/             # API gateway / reverse proxy
└── frontend/
    ├── src/
    │   ├── app/             # Next.js App Router pages
    │   ├── components/      # Feature components (chat, docs, tasks, workspace)
    │   ├── lib/             # API, Apollo, GraphQL, Socket clients
    │   └── store/           # Zustand state stores
    └── next.config.js
```

Each backend service follows the same internal structure:

```
src/
├── app.module.ts
├── main.ts
├── <feature>/
│   ├── <feature>.module.ts
│   ├── <feature>.service.ts
│   └── <feature>.controller.ts (or .resolver.ts for GraphQL)
└── prisma/
    └── prisma.service.ts
```
