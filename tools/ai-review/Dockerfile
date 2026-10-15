FROM golang:1.25.5-alpine AS build
WORKDIR /src
COPY go.mod go.sum ./
RUN go mod download
COPY . .
RUN CGO_ENABLED=0 go build -trimpath -o /ai-review ./cmd/ai-review

FROM gcr.io/distroless/static-debian12:nonroot
COPY --from=build /ai-review /ai-review
ENTRYPOINT ["/ai-review"]
