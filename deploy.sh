#!/bin/bash
set -e

echo "Pulling latest code..."
git pull

echo "Building frontend..."
docker compose --profile build build frontend-builder
docker compose --profile build run --rm frontend-builder

echo "Copying frontend dist to nginx..."
sudo mkdir -p /var/www/support-ticket-demo
sudo cp -r frontend/dist/. /var/www/support-ticket-demo/

echo "Building and restarting backend..."
docker compose up -d --build backend

echo "Cleaning up old images..."
docker image prune -f

echo "Done. Status:"
docker compose ps
