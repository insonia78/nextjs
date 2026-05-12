# Multi Vendor Marketplace

Monorepo for a marketplace platform built with a Next.js frontend and Spring Boot microservices.

## Architecture

- Frontend: Next.js 15 + React 19 (TypeScript)
- Backend: Spring Boot 3.5 microservices (Java 21)
- API Gateway: Spring Cloud Gateway
- Datastores: MySQL, MongoDB, Elasticsearch
- Messaging: Kafka + Zookeeper

## Services And URLs

When running with Docker Compose:

- Frontend: http://localhost:3000
- Gateway: http://localhost:8090
- User Service (direct): http://localhost:8081
- Product Service (direct): http://localhost:8082/graphql
- Order Service (direct): http://localhost:8083/api/orders
- Payment Service (direct): http://localhost:8084/api/payments

Gateway routes:

- /api/users/** -> user-service
- /graphql -> product-service
- /api/orders/** -> order-service
- /api/payments/** -> payment-service

## Prerequisites

- Docker + Docker Compose
- Node.js 20+
- npm 10+
- Java 21
- Maven 3.9+

## Quick Start With Docker

Build and start everything:

```bash
docker compose up -d --build
```

Stop everything:

```bash
docker compose down
```

Stop and remove volumes:

```bash
docker compose down -v
```

## Run Locally Without Docker (App Processes)

You can keep infrastructure in Docker and run app services locally.

1. Start infra only:

```bash
docker compose up -d mysql mongo elasticsearch zookeeper kafka
```

2. Run backend services from backend folder (separate terminals):

```bash
cd backend
mvn spring-boot:run -pl user-service
mvn spring-boot:run -pl product-service
mvn spring-boot:run -pl order-service
mvn spring-boot:run -pl payment-service
mvn spring-boot:run -pl gateway-service
```

3. Run frontend:

```bash
cd frontend
npm install
npm run dev
```

## Environment Notes

- Compose maps gateway container port 8080 to host 8090.
- Compose maps MySQL container port 3306 to host 3307 by default.
- Frontend uses NEXT_PUBLIC_API_BASE_URL for browser-side calls.
- Payment service uses Stripe when STRIPE_SECRET_KEY is set; otherwise mock behavior is used.

## Project Structure

- backend/
	- gateway-service/
	- user-service/
	- product-service/
	- order-service/
	- payment-service/
- frontend/
	- app/
	- src/components/
	- src/features/
	- src/lib/

## Useful Commands

From repository root:

```bash
docker compose ps
docker compose logs -f gateway-service
docker compose logs -f frontend
```

From frontend folder:

```bash
npm run lint
npm run build
```

From backend folder:

```bash
mvn -q test
```

## Troubleshooting

- Port conflict on 8090/3000/3307: change host mappings in docker-compose.yml.
- Gateway up but API fails: verify dependent services are healthy with docker compose ps.
- Frontend cannot reach backend: check NEXT_PUBLIC_API_BASE_URL value and gateway availability.
- MySQL connection issue in local backend mode: ensure services point to localhost:3307.
