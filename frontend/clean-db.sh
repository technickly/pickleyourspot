#!/bin/bash

# Exit on error
set -e

echo "⚠️  WARNING: This will delete all data except users from the database."
echo "Press Ctrl+C to cancel, or wait 5 seconds to continue..."
sleep 5

# Run backup first
./backup-db.sh

echo "🔄 Running database cleanup..."
node prisma/clean-db.js

echo "✨ Database cleanup completed!" 