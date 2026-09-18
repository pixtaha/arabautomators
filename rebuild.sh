#!/usr/bin/env bash
set -euo pipefail

echo "==> Taking Supabase backup before rebuild..."
/opt/supabase-backups/arabautomators/backup.sh

echo "==> Building and deploying arabautomators-platform..."
cd /opt/arabautomators/platform
docker compose -f docker-compose.prod.yml build \
  --build-arg NEXT_PUBLIC_SUPABASE_URL="https://supabase.arabautomators.com" \
  --build-arg NEXT_PUBLIC_SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoiYW5vbiIsImlzcyI6InN1cGFiYXNlIiwiaWF0IjoxNzg4MjkwMzk2LCJleHAiOjE5NDU5NzAzOTZ9.kuMpmQpJNkL4FAGhWf-pvQwU4njxXndpCcZatGBTCmw"
docker compose -f docker-compose.prod.yml up -d --force-recreate arab-automators-web

echo "==> Done. Backup + rebuild completed."
