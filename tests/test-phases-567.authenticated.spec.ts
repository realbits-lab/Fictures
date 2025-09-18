import { test, expect } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

// Test for phases 5, 6, 7: Character Images, Place Images, Database Storage
test.describe('Phases 5-7 Image Generation and Database Storage', () => {

  test('Test character and place image generation with database storage', async ({ page }) => {
    console.log('🧪 Starting Phases 5-7 Test with authenticated user');

    // Load mock data
    const mockDataPath = path.join(process.cwd(), 'mock-data-phases-567.json');
    if (!fs.existsSync(mockDataPath)) {
      throw new Error('Mock data file not found: mock-data-phases-567.json');
    }

    const mockData = JSON.parse(fs.readFileSync(mockDataPath, 'utf8'));
    console.log('📊 Mock data loaded successfully');
    console.log(`📚 Story: ${mockData.storyConcept.title}`);
    console.log(`👥 Characters: ${mockData.characters.length}`);
    console.log(`🏢 Places: ${mockData.places.length}`);

    // Navigate to app to ensure it's accessible
    await page.goto('/');
    await page.waitForSelector('h1', { timeout: 10000 });
    console.log('✅ Application accessible');

    // Test the phases 5-7 API endpoint
    let testResults: any = null;
    let phases: any = {};
    let timing: any = {};
    let errors: string[] = [];

    // Start the test API call
    console.log('🚀 Starting API call to test-phases-567');

    const startTime = Date.now();
    const response = await page.request.post('/api/test-phases-567', {
      data: mockData,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok()) {
      const errorText = await response.text();
      throw new Error(`API call failed with status ${response.status()}: ${errorText}`);
    }

    // Read the streaming response
    const responseText = await response.text();
    const lines = responseText.split('\\n');

    console.log('📡 Processing streaming response...');

    for (const line of lines) {
      if (line.startsWith('data: ')) {
        try {
          const data = JSON.parse(line.substring(6));

          switch (data.phase) {
            case 'progress':
              console.log(`⏳ ${data.data.phase}: ${data.data.description}`);
              break;

            case 'phase5_complete':
              phases.phase5 = data.data;
              console.log(`✅ Phase 5 completed: ${data.data.characterImages.length} character images in ${data.data.timing}ms`);
              break;

            case 'phase6_complete':
              phases.phase6 = data.data;
              console.log(`✅ Phase 6 completed: ${data.data.placeImages.length} place images in ${data.data.timing}ms`);
              break;

            case 'phase7_complete':
              phases.phase7 = data.data;
              console.log(`✅ Phase 7 completed: Database storage in ${data.data.timing}ms`);
              break;

            case 'test_complete':
              testResults = data.data;
              timing = data.data.results.timing;
              errors = data.data.results.errors;
              console.log(`🏁 Test completed successfully!`);
              console.log(`📊 Summary: ${data.data.summary.charactersCreated} characters, ${data.data.summary.placesCreated} places, ${data.data.summary.imagesGenerated} images`);
              console.log(`⏱️ Total time: ${data.data.summary.totalTime}ms`);
              break;

            case 'error':
              errors.push(data.error);
              console.error(`❌ Error: ${data.error}`);
              break;
          }
        } catch (parseError) {
          console.warn('⚠️ Could not parse streaming data:', line);
        }
      }
    }

    const endTime = Date.now();
    const totalTestTime = endTime - startTime;

    // Verify test results
    expect(testResults).toBeTruthy();
    expect(testResults.storyId).toBeTruthy();

    // Verify Phase 5 - Character Images
    expect(phases.phase5).toBeTruthy();
    expect(phases.phase5.characterImages).toBeTruthy();
    expect(phases.phase5.characterImages.length).toBe(mockData.characters.length);

    console.log('✅ Phase 5 verification passed');
    for (const charImg of phases.phase5.characterImages) {
      expect(charImg.characterId).toBeTruthy();
      expect(charImg.name).toBeTruthy();
      expect(charImg.imageUrl).toBeTruthy();
      expect(charImg.imageUrl).toContain('vercel-storage.com'); // Verify Vercel Blob URL
      console.log(`  📸 Character "${charImg.name}": ${charImg.imageUrl}`);
    }

    // Verify Phase 6 - Place Images
    expect(phases.phase6).toBeTruthy();
    expect(phases.phase6.placeImages).toBeTruthy();
    expect(phases.phase6.placeImages.length).toBe(mockData.places.length);

    console.log('✅ Phase 6 verification passed');
    for (const placeImg of phases.phase6.placeImages) {
      expect(placeImg.placeId).toBeTruthy();
      expect(placeImg.name).toBeTruthy();
      expect(placeImg.imageUrl).toBeTruthy();
      expect(placeImg.imageUrl).toContain('vercel-storage.com'); // Verify Vercel Blob URL
      console.log(`  🏢 Place "${placeImg.name}": ${placeImg.imageUrl}`);
    }

    // Verify Phase 7 - Database Storage
    expect(phases.phase7).toBeTruthy();
    expect(phases.phase7.story).toBeTruthy();
    expect(phases.phase7.characters).toBeTruthy();
    expect(phases.phase7.places).toBeTruthy();

    expect(phases.phase7.story.id).toBe(testResults.storyId);
    expect(phases.phase7.story.title).toBe(mockData.storyConcept.title);
    expect(phases.phase7.characters.length).toBe(mockData.characters.length);
    expect(phases.phase7.places.length).toBe(mockData.places.length);

    console.log('✅ Phase 7 verification passed');
    console.log(`  📚 Story "${phases.phase7.story.title}" created with ID: ${phases.phase7.story.id}`);

    // Verify character database records have images
    for (const char of phases.phase7.characters) {
      expect(char.id).toBeTruthy();
      expect(char.name).toBeTruthy();
      expect(char.imageUrl).toBeTruthy();
      expect(char.imageUrl).toContain('vercel-storage.com');
      console.log(`  👤 Character "${char.name}" saved with image: ${char.imageUrl}`);
    }

    // Verify place database records have images
    for (const place of phases.phase7.places) {
      expect(place.id).toBeTruthy();
      expect(place.name).toBeTruthy();
      expect(place.imageUrl).toBeTruthy();
      expect(place.imageUrl).toContain('vercel-storage.com');
      console.log(`  🏢 Place "${place.name}" saved with image: ${place.imageUrl}`);
    }

    // Verify performance - should complete within reasonable time
    expect(timing.total).toBeLessThan(120000); // 2 minutes max
    expect(totalTestTime).toBeLessThan(150000); // 2.5 minutes max including overhead

    // Verify no critical errors occurred
    expect(errors.length).toBe(0);

    console.log('\\n🎉 All verifications passed!');
    console.log('📊 Performance Summary:');
    console.log(`  ⏱️ Phase 5 (Character Images): ${timing.phase5}ms`);
    console.log(`  ⏱️ Phase 6 (Place Images): ${timing.phase6}ms`);
    console.log(`  ⏱️ Phase 7 (Database): ${timing.phase7}ms`);
    console.log(`  ⏱️ Total API Time: ${timing.total}ms`);
    console.log(`  ⏱️ Total Test Time: ${totalTestTime}ms`);

    // Test image accessibility by making HTTP requests to verify images exist
    console.log('\\n🔍 Verifying image accessibility...');

    const allImages = [
      ...phases.phase5.characterImages.map(img => ({ type: 'character', name: img.name, url: img.imageUrl })),
      ...phases.phase6.placeImages.map(img => ({ type: 'place', name: img.name, url: img.imageUrl }))
    ];

    for (const img of allImages) {
      const imgResponse = await page.request.get(img.url);
      expect(imgResponse.ok()).toBeTruthy();
      expect(imgResponse.headers()['content-type']).toContain('image');
      console.log(`  ✅ ${img.type} "${img.name}" image accessible`);
    }

    console.log('\\n✅ All image accessibility tests passed!');
    console.log(`🎯 Test Summary: Generated ${allImages.length} images and stored complete story data in database`);

    // Store test results for potential analysis
    const testResultsPath = path.join(process.cwd(), 'logs', 'phases-567-test-results.json');
    fs.writeFileSync(testResultsPath, JSON.stringify({
      testResults,
      phases,
      timing,
      performance: {
        totalTestTime,
        imagesGenerated: allImages.length,
        charactersCreated: phases.phase7.characters.length,
        placesCreated: phases.phase7.places.length
      },
      images: allImages
    }, null, 2));

    console.log(`📄 Test results saved to: ${testResultsPath}`);
  });
});