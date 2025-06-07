#!/bin/bash

# Check if DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
  echo "Error: DATABASE_URL environment variable is not set"
  exit 1
fi

echo "Starting reservation cleanup..."

# Extract database connection details from DATABASE_URL
# Example URL format: postgresql://user:password@host:port/database
DB_URL=$DATABASE_URL

# Execute the SQL script
psql "$DB_URL" -f scripts/clear-reservations.sql

if [ $? -eq 0 ]; then
  echo "Successfully deleted all reservations and related data."
  echo "User data has been preserved."
else
  echo "Error occurred while clearing reservations."
  exit 1
fi 