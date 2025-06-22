#!/bin/bash

echo "🧪 Testing MikroTik Controller Deployment..."
echo ""
echo "This script will test if your Docker image is ready and working."
echo ""

# Check if Docker is available
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed on this system."
    echo "To test on another machine with Docker, run:"
    echo "  docker run -d -p 3333:3333 --name mikrotik-test ispacademy/mikrotik-controller:latest"
    exit 1
fi

echo "📥 Pulling your image from Docker Hub..."
docker pull ispacademy/mikrotik-controller:latest

if [ $? -eq 0 ]; then
    echo "✅ Image downloaded successfully!"
    echo ""
    echo "🚀 Starting container..."
    docker run -d -p 3333:3333 --name mikrotik-test ispacademy/mikrotik-controller:latest
    
    echo "⏳ Waiting for container to start..."
    sleep 5
    
    if docker ps | grep mikrotik-test | grep -q "Up"; then
        echo "✅ Container is running!"
        echo "🌐 Your MikroTik Controller is available at: http://localhost:3333"
        echo ""
        echo "📋 To stop the test:"
        echo "  docker stop mikrotik-test && docker rm mikrotik-test"
    else
        echo "❌ Container failed to start. Check logs with:"
        echo "  docker logs mikrotik-test"
    fi
else
    echo "❌ Failed to pull image. The build might still be in progress."
    echo "Check build status at: https://hub.docker.com/r/ispacademy/mikrotik-controller/builds"
fi