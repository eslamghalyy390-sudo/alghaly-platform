#!/usr/bin/env bash
set -euo pipefail
cp -n .env.example .env || true
docker compose -f infra/docker-compose.yml up -d
npm install
npm run db:generate
npm run db:migrate
npm run db:seed
npm run dev
