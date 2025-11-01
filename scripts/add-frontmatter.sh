#!/bin/bash

# Script to add frontmatter to MDX files that don't have it

find /Users/thomasjeon/GitHub/@dev.realbits/Fictures/docs -name "*.mdx" -type f | while read -r file; do
  # Check if file already has frontmatter
  if ! grep -q "^---" "$file"; then
    # Extract title from first # heading
    title=$(grep -m 1 "^# " "$file" | sed 's/^# //')

    # If no title found, use filename
    if [ -z "$title" ]; then
      title=$(basename "$file" .mdx)
    fi

    # Create temp file with frontmatter
    tmpfile=$(mktemp)
    echo "---" > "$tmpfile"
    echo "title: \"$title\"" >> "$tmpfile"
    echo "---" >> "$tmpfile"
    echo "" >> "$tmpfile"
    cat "$file" >> "$tmpfile"

    # Replace original file
    mv "$tmpfile" "$file"

    echo "Added frontmatter to: $file"
  fi
done

echo "Frontmatter addition complete!"
