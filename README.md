# Full-Stack Projects Monorepo

This repository contains three end-to-end projects built to practice modern full-stack architecture with microservices, real-time communication, GraphQL/REST APIs, and multi-database setups.

## Repository Contents

- **AI Study Planner**
  - Folder: `AI Study Planner(Nextjs,Nestjs,REST,Graphql,Postgres,MongoDb,Sokcet.Io,Ollama,JWT)/`
  - Stack: Next.js, NestJS microservices, REST + GraphQL, PostgreSQL, MongoDB, Socket.IO, JWT, Ollama
  - Focus: AI-assisted study planning and progress tracking

- **Multi Vendor Marketplace**
  - Folder: `Multi Vendor Marketplace(Nextjs,Springboot,Mysql,MongoDb,Elasticsearch,Kafka)/`
  - Stack: Next.js, Spring Boot microservices, MySQL, MongoDB, Elasticsearch, Kafka
  - Focus: Marketplace architecture with gateway routing, ordering, and payments

- **Real-Time Collaboration Platform**
  - Folder: `Real-Time Collaboration Platform(Nextjs,NestJs,Prisma,Postgres,Redis,REST,Graphql,JWT)/`
  - Stack: Next.js, NestJS microservices, Prisma, PostgreSQL, Redis, REST + GraphQL, JWT
  - Focus: Team collaboration with real-time chat, tasks, documents, and notifications

## High-Level Tech Coverage

Across the repository, you will find examples of:

- Frontend architectures with Next.js App Router
- Backend microservices with NestJS and Spring Boot
- API gateway patterns
- REST and GraphQL APIs (including subscriptions)
- Real-time systems with Socket.IO and Redis pub/sub
- SQL + NoSQL persistence patterns
- Docker and Docker Compose orchestration
- Authentication and authorization with JWT

## Quick Start

Each project is self-contained and has its own README with exact setup details.

### 1) AI Study Planner

```bash
cd "AI Study Planner(Nextjs,Nestjs,REST,Graphql,Postgres,MongoDb,Sokcet.Io,Ollama,JWT)"
npm install
npm run dev
```

Read project guide: `AI Study Planner(Nextjs,Nestjs,REST,Graphql,Postgres,MongoDb,Sokcet.Io,Ollama,JWT)/README.md`

### 2) Multi Vendor Marketplace

```bash
cd "Multi Vendor Marketplace(Nextjs,Springboot,Mysql,MongoDb,Elasticsearch,Kafka)"
docker compose up -d --build
```

Read project guide: `Multi Vendor Marketplace(Nextjs,Springboot,Mysql,MongoDb,Elasticsearch,Kafka)/README.md`

### 3) Real-Time Collaboration Platform

```bash
cd "Real-Time Collaboration Platform(Nextjs,NestJs,Prisma,Postgres,Redis,REST,Graphql,JWT)"
docker compose up --build
```

Read project guide: `Real-Time Collaboration Platform(Nextjs,NestJs,Prisma,Postgres,Redis,REST,Graphql,JWT)/README.md`

## Suggested Learning Path

If you are exploring this repository for learning, this order gives a smooth progression:

1. **AI Study Planner**: NestJS microservices + mixed REST/GraphQL + dual DB setup
2. **Real-Time Collaboration Platform**: adds stronger real-time patterns and collaborative workflows
3. **Multi Vendor Marketplace**: compares Java/Spring Boot microservices with event-driven components

## Prerequisites

Install the tools below to run all projects comfortably:

- Node.js 18+ (Node.js 20+ recommended)
- npm 9+
- Docker + Docker Compose
- Java 21 + Maven 3.9+ (for Spring Boot services)
- PostgreSQL, MongoDB, Redis, MySQL (if running services outside Docker)

## Notes

- Project folder names intentionally include the main technology stack.
- Keep service ports unique when running multiple projects at the same time.
- For environment variables and seed data, always follow each project's local README.
