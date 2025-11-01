#!/bin/bash

# Fix all MDX syntax issues in docs directory

echo "Fixing MDX syntax issues in all .mdx files..."

find /Users/thomasjeon/GitHub/@dev.realbits/Fictures/docs -name "*.mdx" -type f | while read file; do
  # Fix: <NUMBER followed by unit (ms, s, %, etc.)
  sed -i '' 's/<\([0-9]\+\)\([ms%]\)/`<\1\2`/g' "$file"

  # Fix: < NUMBER followed by unit with optional decimal
  sed -i '' 's/< \([0-9]\+\)\([ms%]\)/`< \1\2`/g' "$file"

  # Fix: <NUMBER.DECIMAL followed by unit
  sed -i '' 's/<\([0-9]\+\.[0-9]\+\)\([ms%]\)/`<\1\2`/g' "$file"

  # Fix: < NUMBER with space
  sed -i '' 's/< \([0-9]\+\) /`< \1` /g' "$file"

  # Fix standalone <NUMBER patterns (not already in backticks)
  sed -i '' 's/\([^`]\)<\([0-9]\)/\1`<\2`/g' "$file"

  echo "Fixed: $(basename "$file")"
done

echo ""
echo "✅ All MDX syntax issues fixed!"
