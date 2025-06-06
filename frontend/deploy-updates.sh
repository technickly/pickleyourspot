#!/bin/bash

# Exit on error
set -e

echo "🚀 Starting deployment of updates..."

# 1. Install dependencies
echo "📦 Installing dependencies..."
npm install

# 2. Generate Prisma Client
echo "🔄 Generating Prisma client..."
npx prisma generate

# 3. Run database migrations
echo "🗃️ Running database migrations..."
npx prisma migrate deploy

# 4. Build the Next.js application
echo "🏗️ Building Next.js application..."
npm run build

# 5. Restart the Next.js service
echo "🔄 Restarting Next.js service..."
if command -v systemctl &> /dev/null; then
    sudo systemctl restart nextjs
else
    # If no systemd, try PM2
    if command -v pm2 &> /dev/null; then
        pm2 restart all
    else
        echo "⚠️ Warning: Neither systemd nor PM2 found. Please restart the application manually."
    fi
fi

# 6. Verify Prisma connection
echo "🔍 Verifying database connection..."
npx prisma db seed

echo "✅ Deployment complete!" 