import postgres from 'postgres';

const client = postgres(process.env.POSTGRES_URL);

async function checkCoverImageSimple() {
  try {
    const result = await client`
      SELECT id, title, story_data
      FROM stories
      WHERE id = 'VTtycrndsyzEjeEHz37Rz'
    `;

    if (result.length > 0) {
      console.log('✅ Story found in database:');
      console.log('- Story ID:', result[0].id);
      console.log('- Title:', result[0].title);

      if (result[0].story_data) {
        const storyData = JSON.parse(result[0].story_data);
        console.log('- Story Data Properties:', Object.keys(storyData).length);
        console.log('- All Properties:', Object.keys(storyData).join(', '));

        if (storyData.coverImage) {
          console.log('✅ Cover image found in storyData:', storyData.coverImage);
        } else {
          console.log('❌ No coverImage property found in story data');
        }
      } else {
        console.log('❌ No story data found');
      }
    } else {
      console.log('❌ Story not found in database');
    }
  } catch (error) {
    console.error('❌ Database query error:', error.message);
  } finally {
    await client.end();
  }
}

checkCoverImageSimple();