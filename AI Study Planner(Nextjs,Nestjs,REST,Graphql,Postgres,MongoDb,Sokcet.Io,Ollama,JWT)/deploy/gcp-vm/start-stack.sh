#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
VM_ENV="$ROOT_DIR/deploy/gcp-vm/.env"
COMPOSE_FILE="$ROOT_DIR/deploy/gcp-vm/docker-compose.yml"
BUILD_ARGS=()

if [[ "${1:-}" == "--no-cache" ]]; then
  BUILD_ARGS+=(--no-cache --pull)
fi

if [[ ! -f "$VM_ENV" ]]; then
  echo "Missing $VM_ENV. Copy deploy/gcp-vm/.env.example first." >&2
  exit 1
fi

cd "$ROOT_DIR"
docker compose --env-file "$VM_ENV" -f "$COMPOSE_FILE" build "${BUILD_ARGS[@]}"
docker compose --env-file "$VM_ENV" -f "$COMPOSE_FILE" up -d --force-recreate
docker compose --env-file "$VM_ENV" -f "$COMPOSE_FILE" ps