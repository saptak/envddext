#!/bin/bash

# Exit on error
set -e

# Use this image in the Make targets instead of the default one defined there
export IMAGE="envoyproxy/envoy-gateway-extension"

# Function to display messages
log() {
  echo "$(date +'%Y-%m-%d %H:%M:%S') - $1"
}

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
  log "Error: Docker is not running. Please start Docker Desktop first."
  exit 1
fi

# Uninstall existing extension
log "Uninstalling existing Envoy Gateway extension..."
make uninstall-extension

# Use the GitHub templates version
log "Preparing to build with GitHub templates support and VM backend..."
cp ui/src/index.github.tsx ui/src/index.tsx

# Initialize Go modules if needed
if [ ! -f backend/go.sum ]; then
  log "Initializing Go dependencies..."
  cd backend && go mod tidy && cd ..
fi

# Build and Install the extension
log "Building and Installing the extension with VM service backend and GitHub templates support..."
make install-extension

log "Done! The Envoy Gateway extension with VM service backend is now installed."
log "This version resolves all file system and process management limitations."
log "Please open Docker Desktop to use the extension."
