#!/bin/bash

echo "🗑️ Uninstalling MikroTik Router Controller..."

# Use docker-compose or docker compose based on availability
COMPOSE_CMD="docker-compose"
if ! command -v docker-compose &> /dev/null; then
    COMPOSE_CMD="docker compose"
fi

# Stop and remove containers
$COMPOSE_CMD down

# Remove images (optional)
read -p "Remove downloaded images? (y/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    docker rmi yourusername/mikrotik-controller:latest 2>/dev/null || echo "Image not found or already removed"
    echo "✅ Images removed"
fi

echo "✅ MikroTik Router Controller uninstalled"