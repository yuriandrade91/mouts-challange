#!/usr/bin/env bash
set -e

HOST=${DATABASE_HOST:-postgres}
DB_PORT=${DATABASE_PORT:-5432}

echo "Waiting for Postgres at ${HOST}:${DB_PORT}..."

while ! bash -c "echo > /dev/tcp/${HOST}/${DB_PORT}" 2>/dev/null; do
  sleep 1
done

echo "Postgres is available"
exec "$@"
