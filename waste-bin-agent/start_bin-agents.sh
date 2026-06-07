#!/bin/bash

set -euo pipefail

replicas=5
config="local"

log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $*"
}

while [[ $# -gt 0 ]]; do
    case "$1" in
        --replicas)
            replicas="$2"
            shift 2
            ;;
        --config)
            config="$2"
            shift 2
            ;;
        *)
            log "ERROR: Unknown argument: $1"
            exit 1
            ;;
    esac
done

if ! [[ "$replicas" =~ ^[0-9]+$ ]]; then
    log "ERROR: --replicas must be a positive integer"
    exit 1
fi

case "$config" in
    prod)
        env_file=".env.prod.compose"
        ;;
    local)
        env_file=".env.local.compose"
        ;;
    *)
        log "ERROR: --config must be either 'prod' or 'local'"
        exit 1
        ;;
esac

log "Starting deployment"
log "Configuration: $config"
log "Environment file: $env_file"
log "Replicas: $replicas"

docker compose \
    --env-file "$env_file" \
    up \
    --scale device="$replicas"

log "Deployment completed successfully"
