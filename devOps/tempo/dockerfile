ARG VERSION=latest

FROM grafana/tempo:${VERSION}

COPY tempo.yml /etc/tempo/tempo.yml

CMD ["-config.file=/etc/tempo/tempo.yml"]