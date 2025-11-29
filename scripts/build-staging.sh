#!/bin/bash

# Set consistent encoding environment
export LANG=en_US.UTF-8
export LC_ALL=en_US.UTF-8
export NODE_OPTIONS="--max-old-space-size=4096"

echo "Building staging version..."

# Install dependencies
echo "Installing dependencies..."
npm ci

# Get current commit hash
COMMIT_HASH=$(git rev-parse HEAD)

# Build the app
echo "Building React app on commit $COMMIT_HASH"
NODE_ENV=staging REACT_APP_COMMIT_HASH=$COMMIT_HASH npm run build

echo "Staging build completed!"
echo "Build output is in ./dist/"