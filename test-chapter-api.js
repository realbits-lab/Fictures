// Test script for chapter generation API
// This simulates what happens when the "Generate Chapter" button is clicked

async function testChapterGeneration() {
  const testData = {
    storyId: "249540da-795f-4673-8b69-4c98ff617856",
    chapterNumber: 1,
    prompt: "Write an exciting opening chapter where the main character discovers a mysterious letter that changes their life forever.",
    maxTokens: 500,
    temperature: 0.7
  };

  console.log('Testing Chapter Generation API...\n');
  console.log('Request data:', JSON.stringify(testData, null, 2));
  console.log('\n---Starting request---\n');

  try {
    const response = await fetch('http://localhost:3000/api/chapters/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // Note: In production, this would include authentication cookies
      },
      body: JSON.stringify(testData),
    });

    console.log('Response Status:', response.status, response.statusText);
    console.log('Response Headers:', Object.fromEntries(response.headers.entries()));

    if (!response.ok) {
      const errorText = await response.text();
      console.error('\nError Response:', errorText);
      return;
    }

    // Handle streaming response
    if (response.body) {
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let result = '';

      console.log('\n---Streaming Response---\n');
      
      while (true) {
        const { done, value } = await reader.read();
        
        if (done) break;
        
        const chunk = decoder.decode(value, { stream: true });
        result += chunk;
        process.stdout.write(chunk); // Stream to console
      }

      console.log('\n\n---End of Response---');
      console.log('\nTotal characters received:', result.length);
      console.log('Word count:', result.split(/\s+/).filter(w => w.length > 0).length);
    }
  } catch (error) {
    console.error('\nFetch Error:', error.message);
    console.error('Stack:', error.stack);
  }
}

// Run the test
testChapterGeneration().catch(console.error);