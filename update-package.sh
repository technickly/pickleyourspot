#!/bin/bash

# Create a temporary file with the new package.json content
cat > package.json.tmp << 'EOL'
{
  "name": "court-reservation-frontend",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "add-courts": "ts-node scripts/add-sf-courts.ts",
    "dev:ssl": "local-ssl-proxy --source 443 --target 3000 --cert localhost.pem --key localhost-key.pem & next dev",
    "ssl:setup": "openssl req -x509 -out localhost.pem -keyout localhost-key.pem -newkey rsa:2048 -nodes -sha256 -subj '/CN=localhost' -days 365"
  },
  "dependencies": {
    "@prisma/client": "^6.8.2",
    "next": "^15.3.3",
    "react": "^19.1.0",
    "react-dom": "^19.1.0",
    "next-auth": "^4.24.11",
    "date-fns": "^4.1.0",
    "date-fns-tz": "^3.2.0",
    "react-hot-toast": "^2.5.2",
    "react-icons": "^5.5.0"
  },
  "devDependencies": {
    "@types/node": "^22.15.29",
    "@typescript-eslint/eslint-plugin": "^6.13.2",
    "@typescript-eslint/parser": "^6.13.2",
    "autoprefixer": "^10.4.21",
    "eslint": "^8.55.0",
    "eslint-config-next": "^14.0.3",
    "local-ssl-proxy": "^2.0.5",
    "postcss": "^8.5.4",
    "prisma": "^5.7.0",
    "tailwindcss": "^3.4.17",
    "typescript": "^5.8.3",
    "ts-node": "^10.9.2"
  }
}
EOL

# Move the temporary file to package.json
mv package.json.tmp package.json 