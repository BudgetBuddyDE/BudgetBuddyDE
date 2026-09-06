# Build stage
FROM node:24-alpine AS builder

WORKDIR /app

# The documentation can be built independently from this directory.
COPY package.json ./

# No workspace lockfile is needed because the repository keeps a single root lockfile.
RUN npm install --ignore-scripts --no-package-lock
COPY . .
RUN npm run build

# Production stage
FROM nginx:alpine

# Copy built documentation from builder
COPY --from=builder /app/dist/public /usr/share/nginx/html

# Copy nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expose port 80
EXPOSE 80

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost/ || exit 1

# Start nginx
CMD ["nginx", "-g", "daemon off;"]
