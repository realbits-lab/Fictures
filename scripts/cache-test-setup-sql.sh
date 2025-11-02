#!/bin/bash

# Cache Performance Test - Database Setup (SQL Version)
# Creates mockup test data directly via SQL

echo "🚀 Cache Performance Test - Database Setup (SQL)"
echo ""

# Load environment from .env.local
if [ ! -f .env.local ]; then
  echo "❌ .env.local file not found"
  exit 1
fi

# Extract POSTGRES_URL
POSTGRES_URL=$(grep POSTGRES_URL .env.local | cut -d '=' -f2-)

if [ -z "$POSTGRES_URL" ]; then
  echo "❌ POSTGRES_URL not found in .env.local"
  exit 1
fi

echo "✅ Database connection configured"
echo ""

# Create test user
echo "📝 Creating test user..."

psql "$POSTGRES_URL" <<SQL
-- Create test user if not exists
INSERT INTO users (email, name, role, created_at, updated_at)
VALUES ('cache-test@fictures.xyz', 'Cache Test User', 'writer', NOW(), NOW())
ON CONFLICT (email) DO NOTHING;

-- Get user ID
\set test_user_id (SELECT id FROM users WHERE email = 'cache-test@fictures.xyz');
SQL

echo "✅ Test user created"
echo ""

# Get user ID
TEST_USER_ID=$(psql "$POSTGRES_URL" -t -c "SELECT id FROM users WHERE email = 'cache-test@fictures.xyz';")
TEST_USER_ID=$(echo $TEST_USER_ID | tr -d ' ')

echo "User ID: $TEST_USER_ID"
echo ""

# Clear previous test data
echo "🗑️  Clearing previous test data..."

psql "$POSTGRES_URL" <<SQL
-- Delete test stories and related data (cascade will handle chapters and scenes)
DELETE FROM stories WHERE title LIKE 'Cache Test Story%' AND author_id = '$TEST_USER_ID';
SQL

echo "✅ Previous data cleared"
echo ""

# Create test stories
echo "📚 Creating 3 test stories..."

psql "$POSTGRES_URL" <<SQL
-- Story 1 (published)
INSERT INTO stories (
  title, genre, status, author_id, summary, tone,
  moral_framework, view_count, image_url, created_at, updated_at
)
VALUES (
  'Cache Test Story 1',
  'fantasy',
  'published',
  '$TEST_USER_ID',
  'This is a test story for cache performance testing. Story 1 with chapters and scenes.',
  'aspirational',
  '{"centralVirtue": "courage", "testedVirtues": ["honesty", "perseverance"], "consequencePattern": "redemption"}'::jsonb,
  100,
  'https://placehold.co/1792x1024?text=Story+1',
  NOW(),
  NOW()
);

-- Story 2 (writing)
INSERT INTO stories (
  title, genre, status, author_id, summary, tone,
  moral_framework, view_count, image_url, created_at, updated_at
)
VALUES (
  'Cache Test Story 2',
  'fantasy',
  'writing',
  '$TEST_USER_ID',
  'This is a test story for cache performance testing. Story 2 with chapters and scenes.',
  'aspirational',
  '{"centralVirtue": "courage", "testedVirtues": ["honesty", "perseverance"], "consequencePattern": "redemption"}'::jsonb,
  200,
  'https://placehold.co/1792x1024?text=Story+2',
  NOW(),
  NOW()
);

-- Story 3 (writing)
INSERT INTO stories (
  title, genre, status, author_id, summary, tone,
  moral_framework, view_count, image_url, created_at, updated_at
)
VALUES (
  'Cache Test Story 3',
  'fantasy',
  'writing',
  '$TEST_USER_ID',
  'This is a test story for cache performance testing. Story 3 with chapters and scenes.',
  'aspirational',
  '{"centralVirtue": "courage", "testedVirtues": ["honesty", "perseverance"], "consequencePattern": "redemption"}'::jsonb,
  300,
  'https://placehold.co/1792x1024?text=Story+3',
  NOW(),
  NOW()
);
SQL

echo "✅ Stories created"
echo ""

# Get story IDs
STORY_IDS=$(psql "$POSTGRES_URL" -t -c "SELECT id FROM stories WHERE title LIKE 'Cache Test Story%' AND author_id = '$TEST_USER_ID' ORDER BY title;")

# Create chapters and scenes for each story
STORY_NUM=1
for STORY_ID in $STORY_IDS; do
  STORY_ID=$(echo $STORY_ID | tr -d ' ')

  echo "  Story $STORY_NUM ($STORY_ID):"
  echo "    📖 Creating 5 chapters..."

  for CHAPTER_NUM in {1..5}; do
    # Create chapter
    CHAPTER_ID=$(psql "$POSTGRES_URL" -t -c "
      INSERT INTO chapters (
        title, summary, story_id, author_id, order_index,
        status, arc_position, adversity_type, virtue_type,
        created_at, updated_at
      )
      VALUES (
        'Chapter $CHAPTER_NUM: Testing Cache Layer $CHAPTER_NUM',
        'This chapter tests caching behavior at layer $CHAPTER_NUM. It contains scenes with various content.',
        '$STORY_ID',
        '$TEST_USER_ID',
        $CHAPTER_NUM,
        CASE WHEN $CHAPTER_NUM <= 3 THEN 'published' ELSE 'writing' END,
        $CHAPTER_NUM / 5.0,
        'external',
        'courage',
        NOW(),
        NOW()
      )
      RETURNING id;
    ")

    CHAPTER_ID=$(echo $CHAPTER_ID | tr -d ' ')

    echo "      ✅ Chapter $CHAPTER_NUM: $CHAPTER_ID"
    echo "        🎬 Creating 3 scenes..."

    # Create 3 scenes for this chapter
    for SCENE_NUM in {1..3}; do
      GLOBAL_SCENE_NUM=$(( ($CHAPTER_NUM - 1) * 3 + $SCENE_NUM ))

      CONTENT="This is scene $GLOBAL_SCENE_NUM for cache testing.

It contains multiple paragraphs to simulate real content.

The scene is designed to test caching behavior across three layers:
1. SWR Memory Cache (30 minutes)
2. localStorage Cache (1 hour)
3. Redis Cache (10 minutes for public)

Each layer should be tested for cold and warm loads.

Scene $GLOBAL_SCENE_NUM - Chapter $CHAPTER_NUM - Story $STORY_NUM"

      WORD_COUNT=$(echo "$CONTENT" | wc -w)

      psql "$POSTGRES_URL" -c "
        INSERT INTO scenes (
          title, content, chapter_id, author_id, order_index,
          status, visibility, cycle_phase, emotional_beat,
          word_count, view_count, image_url, created_at, updated_at
        )
        VALUES (
          'Scene $GLOBAL_SCENE_NUM: Cache Test',
          \$\$${CONTENT}\$\$,
          '$CHAPTER_ID',
          '$TEST_USER_ID',
          $SCENE_NUM,
          'published',
          CASE WHEN $SCENE_NUM = 1 THEN 'public' ELSE 'unlisted' END,
          'adversity',
          'tension',
          $WORD_COUNT,
          $(( $GLOBAL_SCENE_NUM * 10 )),
          'https://placehold.co/1344x768?text=Scene+$GLOBAL_SCENE_NUM',
          NOW(),
          NOW()
        );
      " > /dev/null
    done

    echo "        ✅ Created 3 scenes"
  done

  STORY_NUM=$(( $STORY_NUM + 1 ))
done

echo ""
echo "✅ Database setup complete!"
echo ""

# Verify data
echo "📊 Test Data Summary:"
STORY_COUNT=$(psql "$POSTGRES_URL" -t -c "SELECT COUNT(*) FROM stories WHERE title LIKE 'Cache Test Story%';")
CHAPTER_COUNT=$(psql "$POSTGRES_URL" -t -c "SELECT COUNT(*) FROM chapters WHERE story_id IN (SELECT id FROM stories WHERE title LIKE 'Cache Test Story%');")
SCENE_COUNT=$(psql "$POSTGRES_URL" -t -c "SELECT COUNT(*) FROM scenes WHERE chapter_id IN (SELECT id FROM chapters WHERE story_id IN (SELECT id FROM stories WHERE title LIKE 'Cache Test Story%'));")

echo "  - Stories: $STORY_COUNT"
echo "  - Chapters: $CHAPTER_COUNT"
echo "  - Scenes: $SCENE_COUNT"
echo ""

echo "Test Story IDs:"
psql "$POSTGRES_URL" -t -c "SELECT id, title, status FROM stories WHERE title LIKE 'Cache Test Story%' ORDER BY title;"

echo ""
echo "Next steps:"
echo "  1. Visit test page: http://localhost:3000/test/cache-performance"
echo "  2. Run API measurement: dotenv --file .env.local run node scripts/cache-test-measure.mjs"
echo "  3. Run E2E tests: dotenv --file .env.local run npx playwright test tests/cache-performance.spec.ts"
echo ""
