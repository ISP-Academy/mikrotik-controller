# Deploy Guardian Relay v1.3.0

```bash
# Stop server
kill $(ps aux | grep 'node src/server.js' | grep -v grep | awk '{print $2}')

# Deploy to GitHub
git add -A
git commit -m "Guardian Relay v1.3.0"
git tag -a v1.3.0 -m "Guardian Relay v1.3.0"
git push origin main
git push origin v1.3.0
```

Docker Hub will automatically build from GitHub.