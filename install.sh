#!/bin/bash

echo "🚀 Installing MikroTik Router Controller..."

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install Docker first."
    echo "Visit: https://docs.docker.com/get-docker/"
    exit 1
fi

# Check if Docker Compose is installed
if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
    echo "❌ Docker Compose is not installed. Please install Docker Compose first."
    exit 1
fi

# Use docker-compose or docker compose based on availability
COMPOSE_CMD="docker-compose"
if ! command -v docker-compose &> /dev/null; then
    COMPOSE_CMD="docker compose"
fi

# Pull the latest image
echo "📥 Pulling latest MikroTik Controller..."
$COMPOSE_CMD pull

# Start the service
echo "🏃 Starting MikroTik Controller..."
$COMPOSE_CMD up -d

# Check if it's running
sleep 5
if $COMPOSE_CMD ps | grep -q "Up"; then
    echo "✅ MikroTik Controller is running!"
    echo "🌐 Access it at: http://localhost:3333"
    echo "📋 To stop: $COMPOSE_CMD down"
    echo "🔄 To update: $COMPOSE_CMD pull && $COMPOSE_CMD up -d"
else
    echo "❌ Failed to start. Check logs with: $COMPOSE_CMD logs"
fi