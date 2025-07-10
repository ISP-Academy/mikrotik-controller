# 🚀 Deploy Guardian Relay v1.3.0

## Quick Deploy (Copy & Paste)

### 1. Stop the Server
```bash
kill $(ps aux | grep 'node src/server.js' | grep -v grep | awk '{print $2}')
```

### 2. Git Commands
```bash
# Stage all changes
git add -A

# Commit with detailed message
git commit -m "Release Guardian Relay v1.3.0 - Queue Pagination and IP Blocking

- Add pagination for queue management (10 items per page)
- Add 'Show All Queues' button for viewing all queues  
- Add BLOCK/UNBLOCK functionality for DHCP leases
- Integrate with BLOCKED-CUSTOMERS firewall address list
- Use router local time for block comments
- Update version to 1.3.0 across all files"

# Tag the release
git tag -a v1.3.0 -m "Release v1.3.0 - Queue Pagination and IP Blocking"

# Push everything
git push origin main
git push origin v1.3.0
```

### 3. Docker Build & Push
```bash
# Build images
docker build -t guardian-relay:1.3.0 .
docker build -t guardian-relay:latest .

# Tag for Docker Hub (replace 'ispacademy' with your username)
docker tag guardian-relay:1.3.0 ispacademy/mikrotik-controller:v1.3.0
docker tag guardian-relay:1.3.0 ispacademy/mikrotik-controller:latest

# Login to Docker Hub
docker login

# Push images
docker push ispacademy/mikrotik-controller:v1.3.0
docker push ispacademy/mikrotik-controller:latest
```

### 4. Create GitHub Release

Using GitHub CLI:
```bash
gh release create v1.3.0 \
  --title "Guardian Relay v1.3.0 - Queue Pagination and IP Blocking" \
  --notes-file RELEASE_NOTES_v1.3.0.md
```

Or manually at: https://github.com/yourusername/guardian-relay/releases/new

## 🎉 All-in-One Command

For the brave, here's everything in one line:
```bash
git add -A && git commit -m "Release Guardian Relay v1.3.0" && git tag -a v1.3.0 -m "v1.3.0" && git push origin main && git push origin v1.3.0 && docker build -t guardian-relay:1.3.0 . && docker tag guardian-relay:1.3.0 ispacademy/mikrotik-controller:v1.3.0 && docker tag guardian-relay:1.3.0 ispacademy/mikrotik-controller:latest && docker push ispacademy/mikrotik-controller:v1.3.0 && docker push ispacademy/mikrotik-controller:latest
```

## ✅ Post-Deployment

1. Verify Docker Hub has the new images
2. Test pulling the new version: `docker pull ispacademy/mikrotik-controller:v1.3.0`
3. Update any running instances
4. Announce the release!