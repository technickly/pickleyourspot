#!/bin/bash

# Build the Next.js application
echo "Building Next.js application..."
npm install
npm run build

# Copy nginx configuration
echo "Setting up nginx configuration..."
sudo cp nginx.conf /etc/nginx/sites-available/pickleyourspot.com

# Create symbolic link if it doesn't exist
if [ ! -L /etc/nginx/sites-enabled/pickleyourspot.com ]; then
    sudo ln -s /etc/nginx/sites-available/pickleyourspot.com /etc/nginx/sites-enabled/
fi

# Remove default nginx site if it exists
if [ -L /etc/nginx/sites-enabled/default ]; then
    sudo rm /etc/nginx/sites-enabled/default
fi

# Copy systemd service file
echo "Setting up systemd service..."
sudo cp nextjs.service /etc/systemd/system/

# Reload systemd daemon
sudo systemctl daemon-reload

# Install and setup SSL certificate
echo "Setting up SSL certificate..."
sudo certbot --nginx -d pickleyourspot.com -d www.pickleyourspot.com --non-interactive --agree-tos --email nick@pickleyourspot.com

# Start/restart services
echo "Starting services..."
sudo systemctl enable nextjs
sudo systemctl restart nextjs
sudo systemctl restart nginx

# Show status
echo "Checking service status..."
sudo systemctl status nextjs
sudo systemctl status nginx

echo "Deployment complete! Testing URLs:"
echo "https://pickleyourspot.com"
echo "https://www.pickleyourspot.com"
