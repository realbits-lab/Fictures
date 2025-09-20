// Using built-in fetch (Node.js 18+)

const testStoryYaml = `
story:
  title: "The Lost Symphony"
  genre: "fantasy"
  words: 50000
  goal: "A young musician must find the seven lost notes of creation"
  conflict: "Ancient forces seek to silence music forever"
  outcome: "The symphony is restored and magic returns to the world"
  question: "Can music truly heal a broken world?"

  chars:
    - name: "Aria"
      role: "protagonist"
      arc: "From self-doubt to confident leader"

  themes:
    - "Power of music"
    - "Overcoming fear"

  parts:
    - name: "Act I"
      goal: "Discover the musical curse"
      conflict: "Disbelief from authority figures"
`;

async function testToolSelection() {
  console.log('🧪 Testing Gemini tool selection with "change title" request...\n');

  try {
    const response = await fetch('http://localhost:3000/api/story-analyzer', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        storyYaml: testStoryYaml.trim(),
        userRequest: 'change title'
      })
    });

    const result = await response.json();

    console.log('📊 Response Status:', response.status);
    console.log('📄 Full Response:', JSON.stringify(result, null, 2));

    if (result.toolsUsed) {
      console.log('\n✅ Tools Used:', result.toolsUsed);
    } else {
      console.log('\n❌ No tools were called');
    }

    if (result.error) {
      console.log('\n🚨 Error:', result.error);
    }

    if (result.text) {
      console.log('\n💬 AI Text Response:', result.text);
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testToolSelection();