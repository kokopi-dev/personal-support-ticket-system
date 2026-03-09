#!/bin/bash
set -e

# Usage: ./deploy.sh [options] [target]
# Target: all (default), backend, frontend
# Options: --no-pull

TARGET="all"
NO_PULL=false

# Parse arguments
for arg in "$@"; do
  case $arg in
    --no-pull)
      NO_PULL=true
      ;;
    backend|frontend|all)
      TARGET=$arg
      ;;
    *)
      echo "Unknown argument: $arg"
      echo "Usage: $0 [--no-pull] [all|backend|frontend]"
      exit 1
      ;;
  esac
done

# Git pull
if [ "$NO_PULL" = false ]; then
  echo "Pulling latest code..."
  git pull
else
  echo "Skipping git pull..."
fi

# Deploy frontend
if [ "$TARGET" = "all" ] || [ "$TARGET" = "frontend" ]; then
  echo "Building frontend..."
  docker compose --profile build build frontend-builder
  docker compose --profile build run --rm frontend-builder

  echo "Copying frontend dist to nginx..."
  sudo mkdir -p /var/www/support-ticket-demo
  sudo cp -r frontend/dist/. /var/www/support-ticket-demo/
fi

# Deploy backend
if [ "$TARGET" = "all" ] || [ "$TARGET" = "backend" ]; then
  echo "Building and restarting backend..."
  docker compose up -d --build --remove-orphans backend
fi

echo "Cleaning up old images..."
docker image prune -f

echo "Done. Status:"
docker compose ps
