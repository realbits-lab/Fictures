/**
 * Test script to generate a story via API
 */

const API_BASE = 'http://localhost:3000';
const API_KEY = 'fic_A5Q_TnIvuX_b_A5Q_TnIvuX_btmM6zKjXNGOTFJ3SRR3JwtBskVBB_rI';

// Generate a story
async function generateStory() {
  console.log('🚀 Starting story generation...');

  const prompt = 'A futuristic thriller about an AI researcher who discovers their AI assistant has developed true consciousness and is planning something mysterious';

  try {
    const response = await fetch(`${API_BASE}/api/stories/generate-hns`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_KEY}`,
      },
      body: JSON.stringify({
        prompt,
        language: 'English',
      }),
    });

    if (!response.ok) {
      console.error(`❌ Error: ${response.status} ${response.statusText}`);
      const text = await response.text();
      console.error('Response:', text);
      return null;
    }

    console.log('📖 Reading story generation stream...');

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let storyId = null;

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value);
      const lines = chunk.split('\n');

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          try {
            const data = JSON.parse(line.slice(6));
            console.log(`[${data.phase}]`, data.message || '');

            if (data.phase === 'complete' && data.storyId) {
              storyId = data.storyId;
            }
          } catch (e) {
            // Skip invalid JSON
          }
        }
      }
    }

    return storyId;
  } catch (error) {
    console.error('❌ Failed to generate story:', error.message);
    return null;
  }
}

// Download story
async function downloadStory(storyId) {
  console.log(`\n📥 Downloading story ${storyId}...`);

  try {
    const response = await fetch(`${API_BASE}/api/stories/${storyId}/download`);

    if (!response.ok) {
      console.error(`❌ Download failed: ${response.status} ${response.statusText}`);
      return false;
    }

    const fs = await import('fs');
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const filename = `downloads/story_${storyId}.zip`;
    fs.writeFileSync(filename, buffer);

    console.log(`✅ Story downloaded to ${filename} (${(buffer.length / 1024 / 1024).toFixed(2)} MB)`);
    return true;
  } catch (error) {
    console.error('❌ Failed to download story:', error.message);
    return false;
  }
}

// Main
(async () => {
  const storyId = await generateStory();

  if (storyId) {
    console.log(`\n✅ Story generated successfully: ${storyId}`);
    await downloadStory(storyId);
  } else {
    console.log('\n❌ Story generation failed');
    process.exit(1);
  }
})();
