#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
VM_ENV="$ROOT_DIR/deploy/gcp-vm/.env"
COMPOSE_FILE="$ROOT_DIR/deploy/gcp-vm/docker-compose.yml"

if [[ ! -f "$VM_ENV" ]]; then
  echo "Missing $VM_ENV. Copy deploy/gcp-vm/.env.example first." >&2
  exit 1
fi

cd "$ROOT_DIR"
docker compose --env-file "$VM_ENV" -f "$COMPOSE_FILE" up -d --build
docker compose --env-file "$VM_ENV" -f "$COMPOSE_FILE" ps