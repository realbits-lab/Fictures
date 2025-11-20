#!/bin/bash
# Start test server with testcontainers DATABASE_URL

# Read testcontainers database URL
export DATABASE_URL=$(cat .testcontainers-db-url)
export DATABASE_URL_UNPOOLED=$DATABASE_URL

echo "📝 DATABASE_URL: $DATABASE_URL"
echo "🧹 Clearing Next.js cache..."

# Clear Next.js cache to force fresh module resolution
rm -rf .next

# Load other environment variables from .env.local
# dotenv-cli will not override already-set vars like DATABASE_URL
exec pnpm dotenv -e .env.local -- pnpm dev
