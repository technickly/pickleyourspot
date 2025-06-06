#!/bin/bash

# Generate SSL certificates
openssl req -x509 \
  -out localhost.pem \
  -keyout localhost-key.pem \
  -newkey rsa:2048 \
  -nodes \
  -sha256 \
  -days 365 \
  -subj "/CN=localhost" \
  -extensions EXT \
  -config <(printf "[dn]\nCN=localhost\n[req]\ndistinguished_name = dn\n[EXT]\nsubjectAltName=DNS:localhost\nkeyUsage=digitalSignature\nextendedKeyUsage=serverAuth") 