#!/bin/bash

# Exit on error
set -e

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
docker extension rm envoyproxy/envoy-gateway-extension || true

# Use the GitHub templates version
log "Preparing to build with GitHub templates support..."
cp ui/src/index.github.tsx ui/src/index.tsx

# Build the extension
log "Building the extension..."
docker build -t envoyproxy/envoy-gateway-extension:latest .

# Install the extension
log "Installing the extension with GitHub templates support..."
docker extension install envoyproxy/envoy-gateway-extension:latest --force

# Restore original index.tsx
log "Restoring original index.tsx..."
git checkout -- ui/src/index.tsx

log "Done! The Envoy Gateway extension with GitHub templates support is now installed."
log "Please open Docker Desktop to use the extension."
