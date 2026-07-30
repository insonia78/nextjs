#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
DB_ENV="$ROOT_DIR/database/.env"
DB_ENV_EXAMPLE="$ROOT_DIR/deploy/gcp-vm/database.env.example"
VM_ENV="$ROOT_DIR/deploy/gcp-vm/.env"
COMPOSE_FILE="$ROOT_DIR/deploy/gcp-vm/docker-compose.yml"

if [[ ! -f "$VM_ENV" ]]; then
  echo "Missing $VM_ENV. Copy deploy/gcp-vm/.env.example first." >&2
  exit 1
fi

if [[ ! -f "$DB_ENV" ]]; then
  cp "$DB_ENV_EXAMPLE" "$DB_ENV"
  echo "Created $DB_ENV from example. Update DB_PASSWORD before re-running if needed."
fi

cd "$ROOT_DIR"
docker compose --env-file "$VM_ENV" -f "$COMPOSE_FILE" up -d postgres mongodb

npm install
npm run seed:postgres
npm run seed:mongo