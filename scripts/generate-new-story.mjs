import postgres from 'postgres';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '../.env.local') });

const sql = postgres(process.env.POSTGRES_URL);

console.log('🎯 Starting story generation...');

try {
  // Get the first user from the database
  const users = await sql`SELECT id, email, name FROM users LIMIT 1`;

  if (users.length === 0) {
    console.log('❌ No users found in database. Please create a user first.');
    process.exit(1);
  }

  const user = users[0];
  console.log(`📝 Generating story for user: ${user.name || user.email} (${user.id})`);

  // Story generation prompt
  const storyPrompt = `Write a cyberpunk thriller about a data detective who discovers that their memories have been hacked and replaced with false ones. As they investigate their own past, they uncover a conspiracy involving memory trading on the black market. The protagonist must navigate between what's real and what's been implanted while being hunted by those who want to keep the truth buried.

Key elements:
- Genre: Cyberpunk/Thriller
- Setting: Near-future urban environment with advanced neural technology
- Protagonist: Data detective with expertise in digital forensics
- Central mystery: Personal identity and memory authenticity
- Stakes: Understanding one's own reality while exposing a criminal network
- Tone: Dark, suspenseful, with elements of philosophical questioning about identity

Target length: 60,000 words with multiple chapters and rich character development.`;

  console.log('🚀 Making API call to generate story...');

  // Call the API endpoint directly
  const response = await fetch('http://localhost:3000/api/stories/generate-stream', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Cookie': `next-auth.session-token=${process.env.TEST_SESSION_TOKEN || ''}`
    },
    body: JSON.stringify({
      prompt: storyPrompt,
      language: 'english'
    })
  });

  if (!response.ok) {
    throw new Error(`API call failed: ${response.status} ${response.statusText}`);
  }

  console.log('📡 Streaming response from API...');

  // Handle the streaming response
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
          console.log(`📊 ${data.event}: ${data.data.message || JSON.stringify(data.data)}`);

          if (data.data.storyId) {
            storyId = data.data.storyId;
          }
        } catch (e) {
          // Skip invalid JSON lines
        }
      }
    }
  }

  if (storyId) {
    console.log('🎉 Story generation completed successfully!');
    console.log(`📚 Story ID: ${storyId}`);
    console.log(`🔗 View at: http://localhost:3000/write/story/${storyId}`);
    console.log(`🔗 Read at: http://localhost:3000/read/${storyId}`);
  } else {
    console.log('⚠️  Story generation process completed but no story ID received');
  }

} catch (error) {
  console.error('❌ Error during story generation:', error);
} finally {
  await sql.end();
  process.exit(0);
}