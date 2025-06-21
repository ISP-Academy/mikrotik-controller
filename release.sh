#!/bin/bash

if [ -z "$1" ]; then
    echo "Usage: ./release.sh <version>"
    echo "Example: ./release.sh 1.1.0"
    exit 1
fi

VERSION=$1

echo "🏷️ Creating release $VERSION..."

# Update package.json version
npm version $VERSION --no-git-tag-version

# Commit changes
git add .
git commit -m "Release version $VERSION"

# Create and push tag
git tag -a "v$VERSION" -m "Release version $VERSION"
git push origin main
git push origin "v$VERSION"

echo "✅ Release $VERSION created and pushed to GitHub"
echo "🐳 Docker Hub will automatically build the new image"