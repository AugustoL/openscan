#!/bin/bash

# Set consistent encoding environment
export LANG=en_US.UTF-8
export LC_ALL=en_US.UTF-8
export NODE_OPTIONS="--max-old-space-size=4096"

echo "Building production version..."

# Install dependencies
echo "Installing dependencies..."
npm ci
# 
# Create .env file for production
echo "Creating production environment file..."
echo "REACT_APP_ENVIRONMENT=production" > .env

# Get current commit hash
COMMIT_HASH=$(git rev-parse HEAD)

# Clean previous build
rm -r dist || true

# Build the app
echo "Building React app on commit $COMMIT_HASH"
NODE_ENV=production REACT_APP_COMMIT_HASH=$COMMIT_HASH npm run build

echo "Production build completed!"
echo "Build output is in ./dist/"

# Get IPFS hash (ensure consistent chunking)
ipfs add -r --chunker=size-262144 --raw-leaves=false ./dist
HASH=$(ipfs add -r -Q --chunker=size-262144 --raw-leaves=false ./dist)
HASH_V1=$(ipfs cid format -v 1 -b base32 $HASH)

echo "IPFS Hash (v0): $HASH"
echo "IPFS Hash (v1): $HASH_V1"
echo ""
echo "IPFS URLs:"
echo "  - https://ipfs.io/ipfs/$HASH"
echo "  - https://cloudflare-ipfs.com/ipfs/$HASH"
echo "  - https://gateway.ipfs.io/ipfs/$HASH"
echo ""
echo "IPFS v1 URLs:"
echo "  - https://$HASH_V1.ipfs.dweb.link"
echo "  - https://$HASH_V1.ipfs.cf-ipfs.com"