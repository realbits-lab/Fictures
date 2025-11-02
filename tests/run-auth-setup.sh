#!/bin/bash

echo "========================================="
echo "Authentication Setup for Playwright Tests"
echo "========================================="
echo ""
echo "This script will help you create authentication files for testing."
echo "You'll need to login manually in the browser that opens."
echo ""
echo "Accounts needed:"
echo "  1. writer@fictures.xyz  - Primary testing account"
echo "  2. manager@fictures.xyz - Admin account (optional)"
echo "  3. reader@fictures.xyz  - Reader account (optional)"
echo ""
echo "Press ENTER to start with writer account..."
read

echo ""
echo "Running auth setup (this will open a browser)..."
echo "You have 90 seconds to login after the browser opens."
echo ""

npx playwright test tests/auth.setup.ts --headed --project=setup --grep="authenticate as writer"

echo ""
echo "========================================="
echo "Checking auth files..."
echo "========================================="
ls -lh .auth/

echo ""
if [ -f ".auth/writer.json" ]; then
  echo "✅ Writer auth created successfully!"
  echo ""
  echo "Would you like to set up manager and reader accounts too? (y/n)"
  read -r response
  
  if [[ "$response" =~ ^[Yy]$ ]]; then
    echo "Running manager auth setup..."
    npx playwright test tests/auth.setup.ts --headed --project=setup --grep="authenticate as manager"
    
    echo "Running reader auth setup..."
    npx playwright test tests/auth.setup.ts --headed --project=setup --grep="authenticate as reader"
  else
    echo "Copying writer auth to manager and reader..."
    cp .auth/writer.json .auth/manager.json
    cp .auth/writer.json .auth/reader.json
    echo "✅ All auth files created!"
  fi
else
  echo "❌ Writer auth was not created. Please try again."
  exit 1
fi

echo ""
echo "========================================="
echo "Setup Complete!"
echo "========================================="
echo ""
echo "Auth files created:"
ls -lh .auth/
echo ""
echo "Next steps:"
echo "1. Run cache invalidation tests:"
echo "   npx playwright test cache-invalidation-studio.spec.ts"
echo ""
echo "2. Create test data for cache performance tests"
echo "3. Run full test suite"
echo ""
