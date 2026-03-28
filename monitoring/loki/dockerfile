ARG VERSION=3.4

FROM grafana/loki:${VERSION}

# Copy the loki.yml configuration file to the container
COPY loki.yml /etc/loki/loki-confi.yaml

# Command to run Loki
CMD ["-config.file=/etc/loki/loki-confi.yaml"]