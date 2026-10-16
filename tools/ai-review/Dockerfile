FROM ghcr.io/astral-sh/uv:0.13.1 AS uv
FROM python:3.12.15-slim-bookworm
COPY --from=uv /uv /usr/local/bin/uv
RUN apt-get update && apt-get install -y --no-install-recommends git ca-certificates && rm -rf /var/lib/apt/lists/*
WORKDIR /opt/ai-review
ENV UV_PROJECT_ENVIRONMENT=/opt/ai-review/.venv \
    PATH="/opt/ai-review/.venv/bin:$PATH" \
    PYTHONUNBUFFERED=1 \
    TIKTOKEN_CACHE_DIR=/opt/tiktoken-cache
COPY pyproject.toml uv.lock ./
RUN uv sync --frozen --no-dev --no-install-project
COPY ai_review ./ai_review
RUN uv sync --frozen --no-dev \
    && python -c "import tiktoken; tiktoken.get_encoding('o200k_base'); tiktoken.get_encoding('cl100k_base')" \
    && chmod -R a+rX /opt/tiktoken-cache
WORKDIR /tmp
ENTRYPOINT ["python", "-m", "ai_review"]
