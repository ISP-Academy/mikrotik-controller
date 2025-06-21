FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy package files first (better Docker caching)
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production && npm cache clean --force

# Copy application code
COPY . .

# Create non-root user for security
RUN addgroup -g 1001 -S mikrotik && \
    adduser -S mikrotik -u 1001 -G mikrotik && \
    chown -R mikrotik:mikrotik /app

USER mikrotik

# Expose port
EXPOSE 3333

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3333 || exit 1

# Start application
CMD ["npm", "start"]