FROM golang:latest

LABEL org.opencontainers.image.source=https://github.com/budgetbuddyde/budgetbuddyde

WORKDIR /app

COPY go.mod go.sum ./

RUN go mod download

COPY . .

RUN go build -o pocketbase .

ENV PORT 8080
EXPOSE 8080

CMD ["./pocketbase", "serve", "--http=0.0.0.0:8080"]