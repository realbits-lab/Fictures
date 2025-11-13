#!/bin/bash
# Script to update API path references after migration
# Date: 2025-11-13

set -e

echo "Starting API path migration updates..."

# Function to perform replacement in files
update_paths() {
    local old_path=$1
    local new_path=$2
    local description=$3

    echo "Updating: $description"
    echo "  From: $old_path"
    echo "  To: $new_path"

    # Find all TypeScript, JavaScript, and TSX files in src directory
    find /home/web/GitHub/@dev.realbits/Fictures/apps/web/src -type f \( -name "*.ts" -o -name "*.tsx" -o -name "*.js" -o -name "*.jsx" \) -exec sed -i "s|$old_path|$new_path|g" {} +

    echo "  ✓ Complete"
    echo ""
}

# Update each API path
update_paths "/analysis/api/" "/api/analysis/" "Analysis APIs"
update_paths "/comics/api/" "/api/comics/" "Comics APIs"
update_paths "/community/api/" "/api/community/" "Community APIs"
update_paths "/novels/api/" "/api/novels/" "Novels APIs"
update_paths "/publish/api/" "/api/publish/" "Publish APIs"
update_paths "/settings/api/" "/api/settings/" "Settings APIs"
update_paths "/studio/api/" "/api/studio/" "Studio APIs"
update_paths "/test/cache-performance/api/" "/api/test/cache-performance/" "Test APIs"

echo "✓ All API path references updated successfully!"
echo ""
echo "Summary:"
echo "  - analysis/api → api/analysis"
echo "  - comics/api → api/comics"
echo "  - community/api → api/community"
echo "  - novels/api → api/novels"
echo "  - publish/api → api/publish"
echo "  - settings/api → api/settings"
echo "  - studio/api → api/studio"
echo "  - test/cache-performance/api → api/test/cache-performance"
