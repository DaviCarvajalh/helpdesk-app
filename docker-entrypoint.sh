#!/bin/sh
set -e

echo "[entrypoint] Aplicando migraciones de Prisma (prisma migrate deploy)..."
npx prisma migrate deploy

echo "[entrypoint] Migraciones aplicadas. Iniciando servidor..."
exec "$@"
