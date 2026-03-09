#!/bin/bash
set -e

echo "Pulling latest code..."
git pull

echo "Building and restarting containers..."
docker compose --env-file ./frontend/.env up -d --build

echo "Cleaning up old images..."
docker image prune -f

echo "Done. Status:"
docker compose ps
