#!/bin/bash

echo "🔄 Waiting for Postgres..."

# Wait for DB to be ready (use bash's built-in instead of netcat)
# Wait for Postgres to be ready
while ! nc -z db 5432; do
  sleep 1
done

export PYTHONPATH=/app

echo "✅ Postgres is ready."

echo "🧹 Resetting migrations..."
rm -f alembic/versions/*.py

echo "📦 Generating fresh migration..."
alembic revision --autogenerate -m "clean schema"

echo "🚀 Applying migrations..."
alembic upgrade head

echo "🔥 Starting server..."
exec uvicorn app.main:app \
  --host 0.0.0.0 \
  --port 8000 \
  --reload \
  --ssl-keyfile=certs/key.pem \
  --ssl-certfile=certs/cert.pem

