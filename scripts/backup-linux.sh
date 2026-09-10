#!/usr/bin/env bash
set -euo pipefail
: "${DATABASE_URL:?DATABASE_URL is required}"
DESTINATION="${BACKUP_DIR:-./backups}"
RETENTION_DAYS="${BACKUP_RETENTION_DAYS:-30}"
mkdir -p "$DESTINATION"
STAMP=$(date -u +%Y-%m-%dT%H-%M-%SZ)
FILE="$DESTINATION/alghaly-$STAMP.sql"
pg_dump "$DATABASE_URL" --no-owner --no-privileges --file="$FILE"
find "$DESTINATION" -type f -name 'alghaly-*.sql' -mtime "+$RETENTION_DAYS" -delete
printf 'Backup created: %s\n' "$FILE"
