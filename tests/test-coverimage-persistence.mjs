// Test script to verify coverImage persistence in database
const storyId = 'VTtycrndsyzEjeEHz37Rz';
const testCoverImageUrl = 'https://test-blob-url.com/test-image.png';

console.log('🔍 Testing coverImage persistence...');

// Test 1: Save story data with coverImage
const testStoryData = {
  title: "Digital Rebellion",
  genre: "Cyberpunk", 
  words: 80000,
  coverImage: testCoverImageUrl
};

try {
  console.log('📤 Saving story data with coverImage...');
  const saveResponse = await fetch(`http://localhost:3000/api/stories/${storyId}/write`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'Cookie': 'authjs.session-token=test-session' // This won't work but we can test the flow
    },
    body: JSON.stringify({ storyData: testStoryData })
  });
  
  const saveResult = await saveResponse.text();
  console.log('💾 Save response status:', saveResponse.status);
  console.log('💾 Save response:', saveResult);

  // Test 2: Read story data back
  console.log('📥 Reading story data back...');
  const readResponse = await fetch(`http://localhost:3000/api/stories/${storyId}/write`);
  const readResult = await readResponse.text();
  console.log('📖 Read response status:', readResponse.status);
  
  if (readResponse.status === 200) {
    const data = JSON.parse(readResult);
    console.log('📋 Story data properties:', Object.keys(data.story.storyData || {}).length);
    if (data.story.storyData?.coverImage) {
      console.log('✅ CoverImage found:', data.story.storyData.coverImage);
    } else {
      console.log('❌ CoverImage not found in returned data');
    }
  }

} catch (error) {
  console.error('❌ Test error:', error.message);
}
