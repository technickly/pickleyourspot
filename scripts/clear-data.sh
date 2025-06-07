#!/bin/bash

# Check if DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
  echo "Error: DATABASE_URL environment variable is not set"
  exit 1
fi

echo "⚠️  WARNING: This script will delete all users, reservations, and messages."
echo "Courts data will be preserved."
echo "This action cannot be undone."
echo
echo "Please type 'CONFIRM' to proceed:"
read confirmation

if [ "$confirmation" != "CONFIRM" ]; then
  echo "Operation cancelled."
  exit 1
fi

echo
echo "Starting data cleanup..."

# Execute the SQL script
psql "$DATABASE_URL" -f scripts/clear-data.sql

if [ $? -eq 0 ]; then
  echo
  echo "✅ Successfully deleted all users, reservations, and messages."
  echo "Courts data has been preserved."
else
  echo
  echo "❌ Error occurred while clearing data."
  exit 1
fi

# Check if ts-node is installed
if ! command -v ts-node &> /dev/null; then
    echo "Installing ts-node..."
    npm install -g ts-node typescript @types/node
fi

# Run the TypeScript script
ts-node scripts/clear-data.ts 