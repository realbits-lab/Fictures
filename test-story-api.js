// Simple test script to test the story generation API
const fetch = require('node-fetch');

async function testStoryAPI() {
  try {
    console.log('🚀 Testing Story Generation API...');
    
    const response = await fetch('http://localhost:3002/api/stories/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt: "Create a sci-fi story about space exploration and alien contact in the year 2157",
        language: "English"
      })
    });
    
    console.log('Response status:', response.status);
    console.log('Response headers:', Object.fromEntries(response.headers.entries()));
    
    const responseText = await response.text();
    console.log('Response body:', responseText);
    
    if (response.status === 401) {
      console.log('❌ Authentication required - this is expected for the API endpoint');
    } else if (response.status === 200) {
      const data = JSON.parse(responseText);
      console.log('✅ Story generated successfully!');
      console.log('Story ID:', data.story?.id);
      console.log('Story title:', data.story?.title);
    } else {
      console.log('❌ Unexpected response status:', response.status);
    }
    
  } catch (error) {
    console.error('❌ Error testing API:', error);
  }
}

// Test GET endpoint
async function testStoryAPIGet() {
  try {
    console.log('\n🔍 Testing Story Generation API GET endpoint...');
    
    const response = await fetch('http://localhost:3002/api/stories/generate');
    const data = await response.json();
    
    console.log('GET Response:', data);
    
  } catch (error) {
    console.error('❌ Error testing GET API:', error);
  }
}

testStoryAPIGet().then(() => testStoryAPI());