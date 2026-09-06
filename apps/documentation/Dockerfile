# Build stage
FROM node:24-alpine AS builder

WORKDIR /repo

# The documentation is an npm workspace, so the repository root is the build context.
COPY . .

# Install from the single repository lockfile and build only the documentation workspace.
RUN npm ci --ignore-scripts
RUN npm run build --workspace=@budgetbuddyde/documentation

# Production stage
FROM nginx:alpine

# Copy built documentation from builder
COPY --from=builder /repo/apps/documentation/dist/public /usr/share/nginx/html

# Copy nginx configuration
COPY apps/documentation/nginx.conf /etc/nginx/conf.d/default.conf

# Expose port 80
EXPOSE 80

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost/ || exit 1

# Start nginx
CMD ["nginx", "-g", "daemon off;"]
