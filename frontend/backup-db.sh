#!/bin/bash

# Set PostgreSQL environment variables
export PGUSER=frank
export PGPASSWORD=hollyjolly
export PGHOST=localhost
export PGPORT=5432
export PGDATABASE=pys_reservation_01_db

# Create backups directory if it doesn't exist
mkdir -p backups

# Create backup with timestamp
BACKUP_FILE="backups/db_backup_$(date +%Y%m%d_%H%M%S).sql"
echo "Creating backup: $BACKUP_FILE"

# Run pg_dump
pg_dump --clean --if-exists --format=plain --no-owner --no-privileges > "$BACKUP_FILE"

# Remove password from environment
unset PGPASSWORD

echo "✅ Backup completed: $BACKUP_FILE" 