FROM golang:1.26-alpine AS builder
WORKDIR /app
COPY go.mod go.sum ./
RUN go mod download
COPY . .
RUN CGO_ENABLED=0 GOOS=linux go build -o waste-bin-agent .

FROM alpine:3.21
WORKDIR /app
COPY --from=builder /app/waste-bin-agent .
EXPOSE 8090
CMD ["./waste-bin-agent"]
