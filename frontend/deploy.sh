#!/bin/bash

# Configuration
SERVER="ubuntu@18.204.218.155"
REMOTE_DIR="/home/ubuntu/pickleyourspot/frontend"

# Build the Next.js application locally
echo "Building Next.js application locally..."
npm install
npm run build

# Create a temporary directory for the files we want to copy
echo "Preparing files for transfer..."
TEMP_DIR=$(mktemp -d)
cp -r \
    .next \
    app \
    public \
    lib \
    prisma \
    types \
    package.json \
    package-lock.json \
    next.config.cjs \
    tsconfig.json \
    postcss.config.js \
    tailwind.config.js \
    .env \
    "$TEMP_DIR/"

# Ensure the remote directory exists
echo "Creating remote directory..."
ssh $SERVER "mkdir -p $REMOTE_DIR"

# Copy files to the server
echo "Copying files to server..."
scp -r "$TEMP_DIR"/* "$SERVER:$REMOTE_DIR/"

# Clean up temporary directory
rm -rf "$TEMP_DIR"

# SSH into the server and set up the application
echo "Setting up application on server..."
ssh $SERVER "cd $REMOTE_DIR && \
    npm install && \
    sudo cp nginx.conf /etc/nginx/nginx.conf && \
    sudo cp pickleyourspot.conf /etc/nginx/sites-available/pickleyourspot.com && \
    sudo ln -sf /etc/nginx/sites-available/pickleyourspot.com /etc/nginx/sites-enabled/ && \
    sudo rm -f /etc/nginx/sites-enabled/default && \
    sudo cp nextjs.service /etc/systemd/system/ && \
    sudo systemctl daemon-reload && \
    sudo systemctl enable nextjs && \
    sudo systemctl restart nextjs && \
    sudo nginx -t && \
    sudo systemctl restart nginx"

# Set up SSL certificate
echo "Setting up SSL certificate..."
ssh $SERVER "sudo certbot --nginx -d pickleyourspot.com -d www.pickleyourspot.com --non-interactive --agree-tos --email nick@pickleyourspot.com"

# Show status
echo "Checking service status..."
ssh $SERVER "sudo systemctl status nextjs && sudo systemctl status nginx"

echo "Deployment complete! Testing URLs:"
echo "https://pickleyourspot.com"
echo "https://www.pickleyourspot.com"
