#!/bin/bash

# Script to run studio API tests with proper logging
# Usage: ./scripts/run-studio-tests.sh [test-file-name]
#   Example: ./scripts/run-studio-tests.sh parts
#   Example: ./scripts/run-studio-tests.sh all

set -e

# Ensure we're in the apps/web directory
cd "$(dirname "$0")/.."

# Create logs directory if it doesn't exist
mkdir -p ../../logs

# Define test files
declare -A TESTS=(
  ["stories"]="__tests__/api/studio/stories.test.ts"
  ["characters"]="__tests__/api/studio/characters.test.ts"
  ["parts"]="__tests__/api/studio/parts.test.ts"
  ["settings"]="__tests__/api/studio/settings.test.ts"
  ["scenes"]="__tests__/api/studio/scenes.test.ts"
)

# Function to run a single test
run_test() {
  local test_name=$1
  local test_file=$2
  local log_file="../../logs/${test_name}-test.log"

  echo "🧪 Running ${test_name} tests..."
  echo "📝 Log file: ${log_file}"

  dotenv --file .env.local run pnpm test "${test_file}" 2>&1 | tee "${log_file}"

  echo "✅ ${test_name} tests completed"
  echo ""
}

# Main execution
if [ $# -eq 0 ] || [ "$1" == "all" ]; then
  echo "🚀 Running all studio API tests..."
  echo ""

  for test_name in "${!TESTS[@]}"; do
    if [ -f "${TESTS[$test_name]}" ]; then
      run_test "$test_name" "${TESTS[$test_name]}"
    else
      echo "⚠️  Test file not found: ${TESTS[$test_name]}"
    fi
  done

  echo "🎉 All tests completed!"
  echo "📊 Check logs in ../../logs/ directory"
else
  test_name=$1

  if [ -n "${TESTS[$test_name]}" ]; then
    if [ -f "${TESTS[$test_name]}" ]; then
      run_test "$test_name" "${TESTS[$test_name]}"
    else
      echo "❌ Test file not found: ${TESTS[$test_name]}"
      exit 1
    fi
  else
    echo "❌ Unknown test: $test_name"
    echo "Available tests: ${!TESTS[@]}"
    exit 1
  fi
fi
