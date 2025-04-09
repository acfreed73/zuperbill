#!/bin/bash

echo "🔄 Waiting for Postgres..."
while ! nc -z db 5432; do
  sleep 1
done

export PYTHONPATH=/app
export RUN_MAIN=true

echo "✅ Postgres is ready."

echo "📦 Applying migrations..."
alembic upgrade head

echo "🔥 Starting server..."
exec uvicorn app.main:app \
  --host 0.0.0.0 \
  --port 8000

# NOTE:  First Time run we need to create the DB with alembic
# docker compose -f docker-compose.prod.yml exec backend bash
# 
# rm alembic/versions/*.py
# alembic revision --autogenerate -m "clean schema"
# alembic upgrade head
