ARG VERSION=v3.2.1

FROM prom/prometheus:${VERSION}

# Copy the prom.yml configuration file to the container
COPY prom.yml /etc/prometheus/prom.yml

# Command to run Prometheus
CMD ["--config.file=/etc/prometheus/prom.yml", "--storage.tsdb.path=/prometheus"]