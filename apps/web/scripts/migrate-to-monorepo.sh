#!/bin/bash
set -e

echo "🔄 Migrating to monorepo structure..."

# Files and directories to move to apps/web
NEXT_FILES=(
  "src"
  "__tests__"
  "tests"
  "scripts"
  "drizzle"
  "drizzle.config.ts"
  "next.config.mjs"
  "next-env.d.ts"
  "tailwind.config.ts"
  "tsconfig.json"
  "jest.config.js"
  "jest.setup.js"
  "playwright.config.ts"
  "components.json"
  ".eslintrc.json"
  "vercel.json"
)

# Create apps/web if it doesn't exist
mkdir -p apps/web

# Move Next.js specific files
echo "📦 Moving Next.js files to apps/web..."
for item in "${NEXT_FILES[@]}"; do
  if [ -e "$item" ]; then
    echo "  Moving $item..."
    mv "$item" "apps/web/"
  else
    echo "  ⚠️  $item not found, skipping..."
  fi
done

# Copy .env.local if it exists
if [ -f ".env.local" ]; then
  echo "📋 Copying .env.local to apps/web..."
  cp ".env.local" "apps/web/.env.local"
fi

# Copy README.md
if [ -f "README.md" ]; then
  echo "📋 Copying README.md to apps/web..."
  cp "README.md" "apps/web/README.md"
fi

# Replace root package.json
echo "📝 Updating root package.json..."
if [ -f "package.json.new" ]; then
  mv "package.json" "package.json.old"
  mv "package.json.new" "package.json"
fi

echo "✅ Migration complete!"
echo ""
echo "Next steps:"
echo "1. Run: pnpm install"
echo "2. Test web app: pnpm dev:web"
echo "3. Set up Python AI server in apps/ai-server"
