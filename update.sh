#!/bin/bash

echo "🔄 Updating MikroTik Router Controller..."

# Use docker-compose or docker compose based on availability
COMPOSE_CMD="docker-compose"
if ! command -v docker-compose &> /dev/null; then
    COMPOSE_CMD="docker compose"
fi

# Pull latest image
echo "📥 Downloading latest version..."
$COMPOSE_CMD pull

# Restart with new image
echo "🔄 Restarting with new version..."
$COMPOSE_CMD up -d

echo "✅ Update complete!"
echo "🌐 Access at: http://localhost:3333"