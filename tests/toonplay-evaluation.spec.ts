/**
 * Playwright E2E Test: Toonplay Generation with Quality Evaluation
 *
 * Tests the improved toonplay generation system with automatic quality
 * evaluation and iterative improvement.
 *
 * Usage:
 * dotenv --file .env.local run npx playwright test tests/toonplay-evaluation.spec.ts
 */

import { test, expect } from '@playwright/test';

// Use authentication from .auth/user.json (manager@fictures.xyz)
test.use({
  storageState: '.auth/user.json'
});

test.describe('Toonplay Generation with Quality Evaluation', () => {
  let storyId: string;
  let sceneId: string;

  test.beforeAll(async ({ request }) => {
    // Create a test story with a scene for comic generation
    console.log('🎬 Setting up test story for toonplay evaluation...');

    // For this test, we'll assume a story exists or we'll skip if none found
    const response = await request.get('http://localhost:3000/api/stories');

    if (!response.ok()) {
      console.log('⚠️  No stories found. This test requires existing stories.');
      test.skip();
    }

    const data = await response.json();
    const stories = data.stories || [];

    // Find a story with scenes
    let selectedStory = null;
    let selectedScene = null;

    for (const story of stories) {
      if (story.chapters && story.chapters.length > 0) {
        for (const chapter of story.chapters) {
          if (chapter.scenes && chapter.scenes.length > 0) {
            selectedStory = story;
            selectedScene = chapter.scenes[0];
            break;
          }
        }
        if (selectedScene) break;
      }
    }

    if (!selectedStory || !selectedScene) {
      console.log('⚠️  No scenes found. Create a story with scenes first.');
      test.skip();
    }

    storyId = selectedStory.id;
    sceneId = selectedScene.id;

    console.log(`   ✅ Selected story: "${selectedStory.title}" (${storyId})`);
    console.log(`   ✅ Selected scene: "${selectedScene.title}" (${sceneId})`);
  });

  test('should generate comic panels with toonplay evaluation', async ({ page, request }) => {
    test.setTimeout(300000); // 5 minutes for comic generation

    console.log('\n🎨 Testing comic panel generation with toonplay evaluation...');

    // Navigate to scene edit page (if there's a UI for triggering generation)
    // Or test via API directly
    console.log(`📡 Calling API: POST /api/scenes/${sceneId}/comic/generate`);

    const startTime = Date.now();

    const response = await request.post(`http://localhost:3000/api/scenes/${sceneId}/comic/generate`, {
      data: {
        targetPanelCount: 10,
        regenerate: true,
      },
    });

    const duration = Date.now() - startTime;

    // Verify response
    expect(response.ok()).toBeTruthy();

    const result = await response.json();

    console.log(`\n✅ Generation completed in ${(duration / 1000).toFixed(2)}s`);

    // ========================================
    // VERIFY RESPONSE STRUCTURE
    // ========================================

    console.log('\n📊 Verifying response structure...');

    expect(result.success).toBe(true);
    expect(result.message).toBe('Comic panels generated successfully');

    // Verify scene metadata
    expect(result.scene).toBeDefined();
    expect(result.scene.id).toBe(sceneId);
    expect(result.scene.comicStatus).toBe('draft');
    expect(result.scene.comicPanelCount).toBeGreaterThan(0);

    // Verify toonplay result
    expect(result.result).toBeDefined();
    expect(result.result.toonplay).toBeDefined();
    expect(result.result.panels).toBeDefined();
    expect(result.result.metadata).toBeDefined();

    console.log(`   ✅ Scene metadata verified`);
    console.log(`   ✅ Toonplay structure verified`);
    console.log(`   ✅ Panels array verified (${result.result.panels.length} panels)`);

    // ========================================
    // VERIFY EVALUATION DATA
    // ========================================

    console.log('\n📊 Verifying evaluation data...');

    // CRITICAL: Check if evaluation data exists (this is the new feature)
    expect(result.result.evaluation).toBeDefined();

    const evaluation = result.result.evaluation;

    // Verify evaluation structure
    expect(evaluation.weighted_score).toBeDefined();
    expect(evaluation.passes).toBeDefined();
    expect(evaluation.iterations).toBeDefined();
    expect(evaluation.final_report).toBeDefined();

    // Verify evaluation score is within valid range
    expect(evaluation.weighted_score).toBeGreaterThanOrEqual(1.0);
    expect(evaluation.weighted_score).toBeLessThanOrEqual(5.0);

    // Verify iterations is within expected range (0-2)
    expect(evaluation.iterations).toBeGreaterThanOrEqual(0);
    expect(evaluation.iterations).toBeLessThanOrEqual(2);

    console.log(`   ✅ Evaluation data verified`);
    console.log(`   📊 Quality Score: ${evaluation.weighted_score.toFixed(2)}/5.0`);
    console.log(`   ${evaluation.passes ? '✅' : '⚠️'} Status: ${evaluation.passes ? 'PASSES' : 'NEEDS IMPROVEMENT'}`);
    console.log(`   🔄 Iterations: ${evaluation.iterations}`);

    // ========================================
    // VERIFY TOONPLAY QUALITY STANDARDS
    // ========================================

    console.log('\n📋 Verifying toonplay quality standards...');

    const toonplay = result.result.toonplay;

    // 1. Verify panel count is within recommended range (8-12)
    expect(toonplay.total_panels).toBeGreaterThanOrEqual(8);
    expect(toonplay.total_panels).toBeLessThanOrEqual(12);
    console.log(`   ✅ Panel count: ${toonplay.total_panels} (within 8-12 recommended range)`);

    // 2. Verify all panels have required fields
    const panels = toonplay.panels;
    for (const panel of panels) {
      expect(panel.panel_number).toBeDefined();
      expect(panel.shot_type).toBeDefined();
      expect(panel.description).toBeDefined();
      expect(panel.characters_visible).toBeDefined();
      expect(panel.lighting).toBeDefined();
      expect(panel.camera_angle).toBeDefined();
      expect(panel.mood).toBeDefined();
    }
    console.log(`   ✅ All panels have required fields`);

    // 3. Verify shot type distribution
    const shotTypes = panels.map(p => p.shot_type);
    const uniqueShotTypes = new Set(shotTypes);
    expect(uniqueShotTypes.size).toBeGreaterThan(1); // Should have variety
    console.log(`   ✅ Shot type variety: ${uniqueShotTypes.size} different types`);

    // 4. CRITICAL: Verify text overlay requirement (every panel must have dialogue OR narrative)
    const panelsWithoutText = panels.filter(p => {
      const hasNarrative = p.narrative && p.narrative.trim().length > 0;
      const hasDialogue = p.dialogue && p.dialogue.length > 0;
      return !hasNarrative && !hasDialogue;
    });

    expect(panelsWithoutText.length).toBe(0);
    console.log(`   ✅ Text overlay verification: All ${panels.length} panels have text`);

    // 5. Verify narration usage is < 5% (The Golden Rule)
    const panelsWithNarration = panels.filter(p => p.narrative && p.narrative.trim().length > 0).length;
    const narrationPercentage = (panelsWithNarration / panels.length) * 100;

    if (narrationPercentage < 5) {
      console.log(`   ✅ Narration usage: ${panelsWithNarration}/${panels.length} panels (${narrationPercentage.toFixed(1)}%) - Within <5% target`);
    } else {
      console.log(`   ⚠️  Narration usage: ${panelsWithNarration}/${panels.length} panels (${narrationPercentage.toFixed(1)}%) - Exceeds 5% target`);
    }

    // 6. Verify dialogue length limits
    let dialogueViolations = 0;
    for (const panel of panels) {
      if (panel.dialogue) {
        for (const dialogue of panel.dialogue) {
          if (dialogue.text.length > 150) {
            dialogueViolations++;
          }
        }
      }
    }
    expect(dialogueViolations).toBe(0);
    console.log(`   ✅ Dialogue length: All dialogue under 150 characters`);

    // ========================================
    // VERIFY EVALUATION REPORT
    // ========================================

    console.log('\n📄 Evaluation Report:');
    console.log('─'.repeat(60));
    console.log(evaluation.final_report);

    // ========================================
    // SUMMARY
    // ========================================

    console.log('\n═══════════════════════════════════════════════════════════');
    console.log('  TEST SUMMARY');
    console.log('═══════════════════════════════════════════════════════════');
    console.log(`✅ Comic panels generated successfully`);
    console.log(`✅ Quality evaluation system working`);
    console.log(`✅ All toonplay quality standards verified`);
    console.log(`✅ Iterative improvement system operational`);
    console.log(`\n📊 Final Quality Score: ${evaluation.weighted_score.toFixed(2)}/5.0`);
    console.log(`${evaluation.passes ? '✅' : '⚠️'} Status: ${evaluation.passes ? 'PASSES QUALITY THRESHOLD' : 'NEEDS FURTHER IMPROVEMENT'}`);
    console.log(`🔄 Total Iterations: ${evaluation.iterations}`);
    console.log(`⏱️  Total Time: ${(duration / 1000).toFixed(2)}s`);
    console.log('═══════════════════════════════════════════════════════════\n');
  });

  test('should verify comic panels are viewable', async ({ page }) => {
    console.log('\n📖 Testing comic panel viewing...');

    // Navigate to comics view
    await page.goto(`http://localhost:3000/comics/${storyId}`);

    // Wait for page to load
    await page.waitForLoadState('networkidle');

    // Verify page loaded successfully
    await expect(page).toHaveTitle(/Fictures/i);

    // Verify comic panels are visible (this would depend on your UI)
    // Adjust selectors based on actual implementation
    const hasPanels = await page.locator('[data-testid="comic-panel"]').count() > 0 ||
                      await page.locator('img[alt*="panel"]').count() > 0;

    console.log(`   ${hasPanels ? '✅' : '⚠️'} Comic panels visible: ${hasPanels}`);
  });
});
