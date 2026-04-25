#!/bin/sh
set -e

CONTAINER="${1:-vectorops-web-1}"
BACKUP_DIR="${2:-./backups}"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/vectorops_$TIMESTAMP.db"

mkdir -p "$BACKUP_DIR"

echo "Backing up database from container '$CONTAINER'..."
docker exec "$CONTAINER" node --input-type=module -e "
import Database from 'better-sqlite3';
const db = new Database('/app/apps/web/prisma/data/vectorops.db');
db.pragma('wal_checkpoint(TRUNCATE)');
db.close();
"
docker cp "$CONTAINER:/app/apps/web/prisma/data/vectorops.db" "$BACKUP_FILE"

echo "Backup saved to $BACKUP_FILE"
echo "Size: $(du -h "$BACKUP_FILE" | cut -f1)"
