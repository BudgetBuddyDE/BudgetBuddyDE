# Build stage
FROM python:3.12-slim AS builder

WORKDIR /docs

ENV GIT_PYTHON_REFRESH=none

# Copy requirements and install dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy documentation files
COPY mkdocs.yml .
COPY docs/ ./docs/

# Build the documentation
RUN mkdocs build

# Production stage
FROM nginx:alpine

# Copy built documentation from builder
COPY --from=builder /docs/site /usr/share/nginx/html

# Copy nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expose port 80
EXPOSE 80

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost/ || exit 1

# Start nginx
CMD ["nginx", "-g", "daemon off;"]


