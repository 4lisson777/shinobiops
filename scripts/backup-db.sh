#!/bin/sh
set -e

CONTAINER="${1:-vectorops-mysql-1}"
BACKUP_DIR="${2:-./backups}"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/vectorops_$TIMESTAMP.sql"

mkdir -p "$BACKUP_DIR"

echo "Backing up database from container '$CONTAINER'..."
docker exec "$CONTAINER" mysqldump -u vectorops -pvectorops vectorops > "$BACKUP_FILE"

echo "Backup saved to $BACKUP_FILE"
echo "Size: $(du -h "$BACKUP_FILE" | cut -f1)"
