FROM golang:1.23 AS build
WORKDIR /app
COPY go.mod go.sum ./
RUN go mod download
COPY *.go ./
RUN CGO_ENABLED=0 go build -o /shop .

FROM debian:bookworm-slim
COPY --from=build /shop /usr/local/bin/shop
EXPOSE 8080
CMD ["shop"]
