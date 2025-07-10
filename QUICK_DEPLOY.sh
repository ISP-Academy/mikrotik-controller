#!/bin/bash

echo "🚀 Guardian Relay v1.3.0 - Quick Deploy to GitHub"
echo "================================================"
echo ""

# Stop the server first
echo "Stopping server..."
kill $(ps aux | grep 'node src/server.js' | grep -v grep | awk '{print $2}') 2>/dev/null

# Git commands
echo "Deploying to GitHub..."
git add -A
git commit -m "Guardian Relay v1.3.0

- Add pagination for queue management (10 items per page)
- Add 'Show All Queues' button for viewing all queues
- Add BLOCK/UNBLOCK functionality for DHCP leases
- Integrate with BLOCKED-CUSTOMERS firewall address list
- Use router local time for block comments
- Update version to 1.3.0 across all files"

git tag -a v1.3.0 -m "Guardian Relay v1.3.0"
git push origin main
git push origin v1.3.0

echo ""
echo "✅ Deployment Complete!"
echo "Docker Hub will automatically build from the GitHub push."
echo ""
echo "📋 Next Steps:"
echo "1. Check GitHub Actions for build status"
echo "2. Verify Docker Hub has the new v1.3.0 image"
echo "3. Create release on GitHub: https://github.com/yourusername/guardian-relay/releases/new"