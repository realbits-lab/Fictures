import { test, expect } from '@playwright/test';
import { StoryPage } from '../pages/story';

/**
 * RED PHASE - TDD Phase 2: AI Writing Enhancement
 * 
 * These tests will FAIL because Phase 2 AI writing assistance features don't exist yet.
 * This is intentional and follows TDD RED-GREEN-REFACTOR methodology.
 * 
 * Features to test:
 * - Contextual AI assistant with real-time suggestions
 * - Character development tools with consistency tracking
 * - Plot structure visualization and planning
 * - Writing productivity tracking
 */
test.describe('Phase 2: AI Writing Enhancement', () => {
  let storyPage: StoryPage;
  const testStoryId = 'test-story-phase2-ai';
  const testAuthorId = 'test-author-phase2-ai';

  test.beforeEach(async ({ page }) => {
    storyPage = new StoryPage(page);
    await storyPage.loginAsUser(testAuthorId);
    await storyPage.navigateToStory(testStoryId);
    await storyPage.waitForStoryLoad();
  });

  test.describe('Contextual AI Assistant with Real-time Suggestions', () => {
    test('should provide AI writing assistant panel', async () => {
      // This test will FAIL - AI assistant doesn't exist yet
      await storyPage.page.goto(`/stories/${testStoryId}/write`);
      
      const writingInterface = storyPage.page.getByTestId('story-writing-interface');
      await expect(writingInterface).toBeVisible();
      
      // AI assistant panel should be visible
      const aiAssistantPanel = writingInterface.getByTestId('ai-assistant-panel');
      await expect(aiAssistantPanel).toBeVisible();
      
      // Assistant controls
      await expect(aiAssistantPanel.getByTestId('ai-toggle-button')).toBeVisible();
      await expect(aiAssistantPanel.getByTestId('ai-suggestion-type-selector')).toBeVisible();
      await expect(aiAssistantPanel.getByTestId('ai-creativity-slider')).toBeVisible();
      await expect(aiAssistantPanel.getByTestId('ai-context-length-slider')).toBeVisible();
      
      // Suggestion types
      const suggestionTypeSelector = aiAssistantPanel.getByTestId('ai-suggestion-type-selector');
      await suggestionTypeSelector.click();
      
      await expect(storyPage.page.getByTestId('suggestion-type-continuation')).toBeVisible();
      await expect(storyPage.page.getByTestId('suggestion-type-dialogue')).toBeVisible();
      await expect(storyPage.page.getByTestId('suggestion-type-description')).toBeVisible();
      await expect(storyPage.page.getByTestId('suggestion-type-action')).toBeVisible();
      await expect(storyPage.page.getByTestId('suggestion-type-emotion')).toBeVisible();
    });

    test('should provide real-time writing suggestions', async () => {
      // This test will FAIL - real-time suggestions don't exist yet
      await storyPage.page.goto(`/stories/${testStoryId}/write/chapter/1`);
      
      const chapterEditor = storyPage.page.getByTestId('chapter-editor');
      await expect(chapterEditor).toBeVisible();
      
      const textEditor = chapterEditor.getByTestId('text-editor-content');
      
      // Start typing
      await textEditor.click();
      await textEditor.fill('The protagonist walked into the dark forest, feeling');
      
      // AI suggestions should appear
      const suggestionOverlay = storyPage.page.getByTestId('ai-suggestion-overlay');
      await expect(suggestionOverlay).toBeVisible();
      
      const suggestions = suggestionOverlay.getByTestId('ai-suggestion');
      expect(await suggestions.count()).toBeGreaterThanOrEqual(3);
      
      // Each suggestion should have required elements
      const firstSuggestion = suggestions.first();
      await expect(firstSuggestion.getByTestId('suggestion-text')).toBeVisible();
      await expect(firstSuggestion.getByTestId('suggestion-confidence')).toBeVisible();
      await expect(firstSuggestion.getByTestId('accept-suggestion-button')).toBeVisible();
      await expect(firstSuggestion.getByTestId('reject-suggestion-button')).toBeVisible();
      
      // Accept a suggestion
      await firstSuggestion.getByTestId('accept-suggestion-button').click();
      
      // Text should be inserted
      const updatedText = await textEditor.textContent();
      expect(updatedText).toContain('The protagonist walked into the dark forest, feeling');
      expect(updatedText.length).toBeGreaterThan('The protagonist walked into the dark forest, feeling'.length);
    });

    test('should provide contextual grammar and style suggestions', async () => {
      // This test will FAIL - grammar and style checking doesn't exist yet
      await storyPage.page.goto(`/stories/${testStoryId}/write/chapter/1`);
      
      const chapterEditor = storyPage.page.getByTestId('chapter-editor');
      const textEditor = chapterEditor.getByTestId('text-editor-content');
      
      // Type text with intentional issues
      const textWithIssues = "The character was very unique and really amazing. They literally flew threw the air.";
      await textEditor.click();
      await textEditor.fill(textWithIssues);
      
      // Wait for AI analysis
      await storyPage.page.waitForTimeout(2000);
      
      // Grammar and style indicators should appear
      const grammarHighlights = chapterEditor.getByTestId('grammar-highlight');
      const styleHighlights = chapterEditor.getByTestId('style-highlight');
      
      expect(await grammarHighlights.count()).toBeGreaterThan(0);
      expect(await styleHighlights.count()).toBeGreaterThan(0);
      
      // Click on a highlight to see suggestion
      await grammarHighlights.first().click();
      
      const suggestionTooltip = storyPage.page.getByTestId('grammar-suggestion-tooltip');
      await expect(suggestionTooltip).toBeVisible();
      
      await expect(suggestionTooltip.getByTestId('issue-description')).toBeVisible();
      await expect(suggestionTooltip.getByTestId('suggested-correction')).toBeVisible();
      await expect(suggestionTooltip.getByTestId('apply-correction-button')).toBeVisible();
      
      // Apply correction
      await suggestionTooltip.getByTestId('apply-correction-button').click();
      
      // Text should be corrected
      const correctedText = await textEditor.textContent();
      expect(correctedText).not.toContain('threw the air');
      expect(correctedText).toContain('through the air');
    });

    test('should provide dialogue enhancement suggestions', async () => {
      // This test will FAIL - dialogue enhancement doesn't exist yet
      await storyPage.page.goto(`/stories/${testStoryId}/write/chapter/1`);
      
      const chapterEditor = storyPage.page.getByTestId('chapter-editor');
      const textEditor = chapterEditor.getByTestId('text-editor-content');
      
      // Type dialogue
      const dialogueText = '"Hello," she said. "How are you?" he asked. "Fine," she replied.';
      await textEditor.click();
      await textEditor.fill(dialogueText);
      
      // Enable dialogue enhancement mode
      const aiAssistantPanel = storyPage.page.getByTestId('ai-assistant-panel');
      await aiAssistantPanel.getByTestId('ai-suggestion-type-selector').click();
      await storyPage.page.getByTestId('suggestion-type-dialogue').click();
      
      // Select dialogue text
      await textEditor.selectText(dialogueText);
      
      // Dialogue enhancement suggestions should appear
      const dialogueSuggestions = storyPage.page.getByTestId('dialogue-enhancement-suggestions');
      await expect(dialogueSuggestions).toBeVisible();
      
      await expect(dialogueSuggestions.getByTestId('add-dialogue-tags')).toBeVisible();
      await expect(dialogueSuggestions.getByTestId('improve-speech-patterns')).toBeVisible();
      await expect(dialogueSuggestions.getByTestId('add-subtext')).toBeVisible();
      await expect(dialogueSuggestions.getByTestId('enhance-character-voice')).toBeVisible();
      
      // Apply dialogue tag enhancement
      await dialogueSuggestions.getByTestId('add-dialogue-tags').click();
      
      const enhancedText = await textEditor.textContent();
      expect(enhancedText).toContain('she said');
      expect(enhancedText).not.toBe(dialogueText); // Should be enhanced
    });

    test('should provide scene setting and atmosphere suggestions', async () => {
      // This test will FAIL - scene enhancement doesn't exist yet
      await storyPage.page.goto(`/stories/${testStoryId}/write/chapter/1`);
      
      const chapterEditor = storyPage.page.getByTestId('chapter-editor');
      const textEditor = chapterEditor.getByTestId('text-editor-content');
      
      // Type basic scene description
      const sceneText = "It was a dark room. There was a table and chairs.";
      await textEditor.click();
      await textEditor.fill(sceneText);
      
      // Select scene text and request enhancement
      await textEditor.selectText(sceneText);
      
      const contextMenu = storyPage.page.getByTestId('editor-context-menu');
      await expect(contextMenu).toBeVisible();
      
      await contextMenu.getByTestId('enhance-scene-description').click();
      
      // Scene enhancement modal should appear
      const sceneModal = storyPage.page.getByTestId('scene-enhancement-modal');
      await expect(sceneModal).toBeVisible();
      
      // Enhancement options
      await expect(sceneModal.getByTestId('add-sensory-details')).toBeVisible();
      await expect(sceneModal.getByTestId('improve-atmosphere')).toBeVisible();
      await expect(sceneModal.getByTestId('add-visual-descriptions')).toBeVisible();
      await expect(sceneModal.getByTestId('enhance-mood')).toBeVisible();
      
      // Mood selector
      const moodSelector = sceneModal.getByTestId('mood-selector');
      await expect(moodSelector).toBeVisible();
      
      await moodSelector.click();
      await storyPage.page.getByTestId('mood-mysterious').click();
      
      // Apply enhancements
      await sceneModal.getByTestId('apply-scene-enhancements').click();
      
      const enhancedText = await textEditor.textContent();
      expect(enhancedText.length).toBeGreaterThan(sceneText.length);
      expect(enhancedText).not.toBe(sceneText);
    });
  });

  test.describe('Character Development Tools with Consistency Tracking', () => {
    test('should provide character development dashboard', async () => {
      // This test will FAIL - character dashboard doesn't exist yet
      await storyPage.page.goto(`/stories/${testStoryId}/characters`);
      
      const characterDashboard = storyPage.page.getByTestId('character-development-dashboard');
      await expect(characterDashboard).toBeVisible();
      
      // Character list
      const characterList = characterDashboard.getByTestId('characters-list');
      await expect(characterList).toBeVisible();
      
      const characterCards = characterList.getByTestId('character-card');
      expect(await characterCards.count()).toBeGreaterThan(0);
      
      // Each character card should have essential info
      const firstCharacterCard = characterCards.first();
      await expect(firstCharacterCard.getByTestId('character-name')).toBeVisible();
      await expect(firstCharacterCard.getByTestId('character-role')).toBeVisible();
      await expect(firstCharacterCard.getByTestId('character-consistency-score')).toBeVisible();
      await expect(firstCharacterCard.getByTestId('character-development-progress')).toBeVisible();
      
      // Add new character button
      const addCharacterButton = characterDashboard.getByTestId('add-character-button');
      await expect(addCharacterButton).toBeVisible();
    });

    test('should allow creating detailed character profiles', async () => {
      // This test will FAIL - character creation doesn't exist yet
      await storyPage.page.goto(`/stories/${testStoryId}/characters`);
      
      const characterDashboard = storyPage.page.getByTestId('character-development-dashboard');
      const addCharacterButton = characterDashboard.getByTestId('add-character-button');
      
      await addCharacterButton.click();
      
      const characterModal = storyPage.page.getByTestId('create-character-modal');
      await expect(characterModal).toBeVisible();
      
      // Basic information
      await characterModal.getByTestId('character-name-input').fill('Elena Blackwood');
      await characterModal.getByTestId('character-role-select').click();
      await storyPage.page.getByTestId('role-protagonist').click();
      
      // Physical description
      const physicalTab = characterModal.getByTestId('physical-description-tab');
      await physicalTab.click();
      
      await expect(characterModal.getByTestId('age-input')).toBeVisible();
      await expect(characterModal.getByTestId('height-input')).toBeVisible();
      await expect(characterModal.getByTestId('appearance-textarea')).toBeVisible();
      await expect(characterModal.getByTestId('distinctive-features-input')).toBeVisible();
      
      await characterModal.getByTestId('age-input').fill('28');
      await characterModal.getByTestId('appearance-textarea').fill('Tall with dark hair and piercing green eyes');
      
      // Personality traits
      const personalityTab = characterModal.getByTestId('personality-tab');
      await personalityTab.click();
      
      await expect(characterModal.getByTestId('personality-traits-list')).toBeVisible();
      await expect(characterModal.getByTestId('add-trait-button')).toBeVisible();
      await expect(characterModal.getByTestId('character-motivation-textarea')).toBeVisible();
      await expect(characterModal.getByTestId('character-fears-textarea')).toBeVisible();
      
      // Add personality traits
      await characterModal.getByTestId('add-trait-button').click();
      const traitInput = characterModal.getByTestId('trait-input');
      await traitInput.fill('Determined');
      await storyPage.page.keyboard.press('Enter');
      
      // Background and history
      const backgroundTab = characterModal.getByTestId('background-tab');
      await backgroundTab.click();
      
      await characterModal.getByTestId('backstory-textarea').fill('Former detective turned private investigator');
      
      // Save character
      await characterModal.getByTestId('save-character-button').click();
      
      await expect(storyPage.page.getByText('Character created successfully')).toBeVisible();
      
      // Character should appear in the list
      const characterList = storyPage.page.getByTestId('characters-list');
      await expect(characterList.getByText('Elena Blackwood')).toBeVisible();
    });

    test('should track character consistency across chapters', async () => {
      // This test will FAIL - consistency tracking doesn't exist yet
      await storyPage.page.goto(`/stories/${testStoryId}/characters/elena-blackwood`);
      
      const characterProfile = storyPage.page.getByTestId('character-profile-page');
      await expect(characterProfile).toBeVisible();
      
      // Consistency dashboard
      const consistencyDashboard = characterProfile.getByTestId('consistency-dashboard');
      await expect(consistencyDashboard).toBeVisible();
      
      // Overall consistency score
      const consistencyScore = consistencyDashboard.getByTestId('overall-consistency-score');
      await expect(consistencyScore).toBeVisible();
      
      const scoreValue = await consistencyScore.getByTestId('score-value').textContent();
      expect(scoreValue).toMatch(/\d+%/);
      
      // Consistency breakdown
      await expect(consistencyDashboard.getByTestId('physical-consistency')).toBeVisible();
      await expect(consistencyDashboard.getByTestId('personality-consistency')).toBeVisible();
      await expect(consistencyDashboard.getByTestId('dialogue-consistency')).toBeVisible();
      await expect(consistencyDashboard.getByTestId('behavior-consistency')).toBeVisible();
      
      // Consistency issues list
      const issuesList = consistencyDashboard.getByTestId('consistency-issues-list');
      await expect(issuesList).toBeVisible();
      
      const issueItems = issuesList.getByTestId('consistency-issue');
      
      if (await issueItems.count() > 0) {
        const firstIssue = issueItems.first();
        await expect(firstIssue.getByTestId('issue-type')).toBeVisible();
        await expect(firstIssue.getByTestId('issue-description')).toBeVisible();
        await expect(firstIssue.getByTestId('chapter-reference')).toBeVisible();
        await expect(firstIssue.getByTestId('resolve-issue-button')).toBeVisible();
      }
      
      // Character timeline
      const characterTimeline = characterProfile.getByTestId('character-timeline');
      await expect(characterTimeline).toBeVisible();
      
      const timelineEvents = characterTimeline.getByTestId('timeline-event');
      expect(await timelineEvents.count()).toBeGreaterThan(0);
    });

    test('should provide AI-powered character development suggestions', async () => {
      // This test will FAIL - AI character suggestions don't exist yet
      await storyPage.page.goto(`/stories/${testStoryId}/characters/elena-blackwood`);
      
      const characterProfile = storyPage.page.getByTestId('character-profile-page');
      
      // AI suggestions panel
      const aiSuggestionsPanel = characterProfile.getByTestId('ai-character-suggestions');
      await expect(aiSuggestionsPanel).toBeVisible();
      
      // Development suggestions
      const developmentSuggestions = aiSuggestionsPanel.getByTestId('development-suggestions');
      await expect(developmentSuggestions).toBeVisible();
      
      const suggestionCards = developmentSuggestions.getByTestId('suggestion-card');
      expect(await suggestionCards.count()).toBeGreaterThan(0);
      
      // Each suggestion should have relevant information
      const firstSuggestion = suggestionCards.first();
      await expect(firstSuggestion.getByTestId('suggestion-type')).toBeVisible();
      await expect(firstSuggestion.getByTestId('suggestion-description')).toBeVisible();
      await expect(firstSuggestion.getByTestId('suggestion-reasoning')).toBeVisible();
      await expect(firstSuggestion.getByTestId('apply-suggestion-button')).toBeVisible();
      
      // Suggestion types should be relevant
      const suggestionType = await firstSuggestion.getByTestId('suggestion-type').textContent();
      expect(['character-arc', 'personality-depth', 'relationship-development', 'backstory-expansion'])
        .toContain(suggestionType);
      
      // Apply a suggestion
      await firstSuggestion.getByTestId('apply-suggestion-button').click();
      
      const applySuggestionModal = storyPage.page.getByTestId('apply-suggestion-modal');
      await expect(applySuggestionModal).toBeVisible();
      
      await applySuggestionModal.getByTestId('confirm-apply-button').click();
      
      await expect(storyPage.page.getByText('Character development suggestion applied')).toBeVisible();
    });

    test('should track character relationships and dynamics', async () => {
      // This test will FAIL - relationship tracking doesn't exist yet
      await storyPage.page.goto(`/stories/${testStoryId}/characters/relationships`);
      
      const relationshipsPage = storyPage.page.getByTestId('character-relationships-page');
      await expect(relationshipsPage).toBeVisible();
      
      // Relationship map/graph
      const relationshipMap = relationshipsPage.getByTestId('relationship-map');
      await expect(relationshipMap).toBeVisible();
      
      const characterNodes = relationshipMap.getByTestId('character-node');
      expect(await characterNodes.count()).toBeGreaterThan(1);
      
      const relationshipLines = relationshipMap.getByTestId('relationship-line');
      expect(await relationshipLines.count()).toBeGreaterThan(0);
      
      // Click on a relationship to see details
      await relationshipLines.first().click();
      
      const relationshipModal = storyPage.page.getByTestId('relationship-details-modal');
      await expect(relationshipModal).toBeVisible();
      
      await expect(relationshipModal.getByTestId('relationship-type')).toBeVisible();
      await expect(relationshipModal.getByTestId('relationship-strength')).toBeVisible();
      await expect(relationshipModal.getByTestId('relationship-history')).toBeVisible();
      await expect(relationshipModal.getByTestId('relationship-development')).toBeVisible();
      
      // Relationship timeline
      const relationshipTimeline = relationshipModal.getByTestId('relationship-timeline');
      await expect(relationshipTimeline).toBeVisible();
      
      const timelineEvents = relationshipTimeline.getByTestId('relationship-event');
      expect(await timelineEvents.count()).toBeGreaterThan(0);
    });
  });

  test.describe('Plot Structure Visualization and Planning', () => {
    test('should provide visual plot structure dashboard', async () => {
      // This test will FAIL - plot visualization doesn't exist yet
      await storyPage.page.goto(`/stories/${testStoryId}/plot`);
      
      const plotDashboard = storyPage.page.getByTestId('plot-structure-dashboard');
      await expect(plotDashboard).toBeVisible();
      
      // Plot visualization
      const plotVisualization = plotDashboard.getByTestId('plot-visualization');
      await expect(plotVisualization).toBeVisible();
      
      // Plot structure elements
      await expect(plotVisualization.getByTestId('exposition')).toBeVisible();
      await expect(plotVisualization.getByTestId('inciting-incident')).toBeVisible();
      await expect(plotVisualization.getByTestId('rising-action')).toBeVisible();
      await expect(plotVisualization.getByTestId('climax')).toBeVisible();
      await expect(plotVisualization.getByTestId('falling-action')).toBeVisible();
      await expect(plotVisualization.getByTestId('resolution')).toBeVisible();
      
      // Chapter mapping
      const chapterMapping = plotVisualization.getByTestId('chapter-mapping');
      await expect(chapterMapping).toBeVisible();
      
      const chapterMarkers = chapterMapping.getByTestId('chapter-marker');
      expect(await chapterMarkers.count()).toBeGreaterThan(0);
      
      // Each chapter should show its position in the plot structure
      const firstChapter = chapterMarkers.first();
      await expect(firstChapter.getByTestId('chapter-number')).toBeVisible();
      await expect(firstChapter.getByTestId('plot-element')).toBeVisible();
      await expect(firstChapter.getByTestId('tension-level')).toBeVisible();
    });

    test('should analyze plot pacing and provide recommendations', async () => {
      // This test will FAIL - pacing analysis doesn't exist yet
      await storyPage.page.goto(`/stories/${testStoryId}/plot/analysis`);
      
      const plotAnalysisPage = storyPage.page.getByTestId('plot-analysis-page');
      await expect(plotAnalysisPage).toBeVisible();
      
      // Pacing analysis
      const pacingAnalysis = plotAnalysisPage.getByTestId('pacing-analysis');
      await expect(pacingAnalysis).toBeVisible();
      
      // Pacing chart
      const pacingChart = pacingAnalysis.getByTestId('pacing-chart');
      await expect(pacingChart).toBeVisible();
      
      // Tension curve
      const tensionCurve = pacingAnalysis.getByTestId('tension-curve');
      await expect(tensionCurve).toBeVisible();
      
      // Pacing recommendations
      const pacingRecommendations = pacingAnalysis.getByTestId('pacing-recommendations');
      await expect(pacingRecommendations).toBeVisible();
      
      const recommendationItems = pacingRecommendations.getByTestId('recommendation-item');
      expect(await recommendationItems.count()).toBeGreaterThan(0);
      
      const firstRecommendation = recommendationItems.first();
      await expect(firstRecommendation.getByTestId('recommendation-type')).toBeVisible();
      await expect(firstRecommendation.getByTestId('recommendation-description')).toBeVisible();
      await expect(firstRecommendation.getByTestId('affected-chapters')).toBeVisible();
      await expect(firstRecommendation.getByTestId('apply-recommendation-button')).toBeVisible();
      
      // Plot hole detection
      const plotHoleAnalysis = plotAnalysisPage.getByTestId('plot-hole-analysis');
      await expect(plotHoleAnalysis).toBeVisible();
      
      const plotHolesList = plotHoleAnalysis.getByTestId('plot-holes-list');
      const plotHoles = plotHolesList.getByTestId('plot-hole-item');
      
      if (await plotHoles.count() > 0) {
        const firstPlotHole = plotHoles.first();
        await expect(firstPlotHole.getByTestId('plot-hole-description')).toBeVisible();
        await expect(firstPlotHole.getByTestId('severity-level')).toBeVisible();
        await expect(firstPlotHole.getByTestId('suggested-resolution')).toBeVisible();
      }
    });

    test('should provide subplot tracking and management', async () => {
      // This test will FAIL - subplot tracking doesn't exist yet
      await storyPage.page.goto(`/stories/${testStoryId}/plot/subplots`);
      
      const subplotPage = storyPage.page.getByTestId('subplot-management-page');
      await expect(subplotPage).toBeVisible();
      
      // Subplot list
      const subplotList = subplotPage.getByTestId('subplots-list');
      await expect(subplotList).toBeVisible();
      
      const subplotCards = subplotList.getByTestId('subplot-card');
      expect(await subplotCards.count()).toBeGreaterThan(0);
      
      // Each subplot should have essential information
      const firstSubplot = subplotCards.first();
      await expect(firstSubplot.getByTestId('subplot-title')).toBeVisible();
      await expect(firstSubplot.getByTestId('subplot-status')).toBeVisible();
      await expect(firstSubplot.getByTestId('subplot-progress')).toBeVisible();
      await expect(firstSubplot.getByTestId('related-characters')).toBeVisible();
      await expect(firstSubplot.getByTestId('chapter-span')).toBeVisible();
      
      // Add new subplot
      const addSubplotButton = subplotPage.getByTestId('add-subplot-button');
      await addSubplotButton.click();
      
      const subplotModal = storyPage.page.getByTestId('create-subplot-modal');
      await expect(subplotModal).toBeVisible();
      
      await subplotModal.getByTestId('subplot-title-input').fill('Mystery of the Missing Artifacts');
      await subplotModal.getByTestId('subplot-description-textarea').fill('Elena investigates a series of artifact thefts');
      
      // Character involvement
      const characterSelector = subplotModal.getByTestId('character-selector');
      await characterSelector.click();
      await storyPage.page.getByTestId('character-option-elena').click();
      
      // Chapter span
      await subplotModal.getByTestId('start-chapter-input').fill('3');
      await subplotModal.getByTestId('end-chapter-input').fill('8');
      
      await subplotModal.getByTestId('create-subplot-button').click();
      
      await expect(storyPage.page.getByText('Subplot created successfully')).toBeVisible();
    });

    test('should provide story arc templates and guides', async () => {
      // This test will FAIL - story arc templates don't exist yet
      await storyPage.page.goto(`/stories/${testStoryId}/plot/templates`);
      
      const templatesPage = storyPage.page.getByTestId('plot-templates-page');
      await expect(templatesPage).toBeVisible();
      
      // Template categories
      const templateCategories = templatesPage.getByTestId('template-categories');
      await expect(templateCategories).toBeVisible();
      
      await expect(templateCategories.getByTestId('three-act-structure')).toBeVisible();
      await expect(templateCategories.getByTestId('heros-journey')).toBeVisible();
      await expect(templateCategories.getByTestId('five-act-structure')).toBeVisible();
      await expect(templateCategories.getByTestId('save-the-cat')).toBeVisible();
      
      // Select a template
      await templateCategories.getByTestId('three-act-structure').click();
      
      const templateDetails = storyPage.page.getByTestId('template-details');
      await expect(templateDetails).toBeVisible();
      
      await expect(templateDetails.getByTestId('template-description')).toBeVisible();
      await expect(templateDetails.getByTestId('template-structure')).toBeVisible();
      await expect(templateDetails.getByTestId('template-milestones')).toBeVisible();
      
      // Apply template to story
      const applyTemplateButton = templateDetails.getByTestId('apply-template-button');
      await applyTemplateButton.click();
      
      const confirmModal = storyPage.page.getByTestId('apply-template-confirmation');
      await expect(confirmModal).toBeVisible();
      
      await confirmModal.getByTestId('confirm-apply-template').click();
      
      await expect(storyPage.page.getByText('Plot template applied successfully')).toBeVisible();
      
      // Template milestones should appear in plot dashboard
      await storyPage.page.goto(`/stories/${testStoryId}/plot`);
      
      const plotDashboard = storyPage.page.getByTestId('plot-structure-dashboard');
      const milestoneMarkers = plotDashboard.getByTestId('milestone-marker');
      expect(await milestoneMarkers.count()).toBeGreaterThan(0);
    });
  });

  test.describe('Writing Productivity Tracking', () => {
    test('should track writing session metrics', async () => {
      // This test will FAIL - productivity tracking doesn't exist yet
      await storyPage.page.goto(`/stories/${testStoryId}/analytics/productivity`);
      
      const productivityPage = storyPage.page.getByTestId('writing-productivity-page');
      await expect(productivityPage).toBeVisible();
      
      // Writing session metrics
      const sessionMetrics = productivityPage.getByTestId('writing-session-metrics');
      await expect(sessionMetrics).toBeVisible();
      
      await expect(sessionMetrics.getByTestId('total-writing-time')).toBeVisible();
      await expect(sessionMetrics.getByTestId('words-written-today')).toBeVisible();
      await expect(sessionMetrics.getByTestId('average-words-per-session')).toBeVisible();
      await expect(sessionMetrics.getByTestId('writing-streak')).toBeVisible();
      
      // Productivity charts
      const productivityCharts = productivityPage.getByTestId('productivity-charts');
      await expect(productivityCharts).toBeVisible();
      
      await expect(productivityCharts.getByTestId('daily-word-count-chart')).toBeVisible();
      await expect(productivityCharts.getByTestId('writing-time-distribution')).toBeVisible();
      await expect(productivityCharts.getByTestId('productivity-trends')).toBeVisible();
      
      // Goals tracking
      const goalsSection = productivityPage.getByTestId('writing-goals-section');
      await expect(goalsSection).toBeVisible();
      
      const activeGoals = goalsSection.getByTestId('active-goal');
      expect(await activeGoals.count()).toBeGreaterThan(0);
      
      const firstGoal = activeGoals.first();
      await expect(firstGoal.getByTestId('goal-title')).toBeVisible();
      await expect(firstGoal.getByTestId('goal-progress')).toBeVisible();
      await expect(firstGoal.getByTestId('goal-deadline')).toBeVisible();
    });

    test('should provide writing habit analysis and insights', async () => {
      // This test will FAIL - habit analysis doesn't exist yet
      await storyPage.page.goto(`/stories/${testStoryId}/analytics/habits`);
      
      const habitsPage = storyPage.page.getByTestId('writing-habits-page');
      await expect(habitsPage).toBeVisible();
      
      // Writing patterns
      const patternsAnalysis = habitsPage.getByTestId('writing-patterns-analysis');
      await expect(patternsAnalysis).toBeVisible();
      
      // Peak productivity times
      const peakTimes = patternsAnalysis.getByTestId('peak-productivity-times');
      await expect(peakTimes).toBeVisible();
      
      const timeSlots = peakTimes.getByTestId('time-slot');
      expect(await timeSlots.count()).toBeGreaterThan(0);
      
      // Writing environment analysis
      const environmentAnalysis = patternsAnalysis.getByTestId('environment-analysis');
      await expect(environmentAnalysis).toBeVisible();
      
      await expect(environmentAnalysis.getByTestId('most-productive-location')).toBeVisible();
      await expect(environmentAnalysis.getByTestId('optimal-session-length')).toBeVisible();
      await expect(environmentAnalysis.getByTestId('distraction-patterns')).toBeVisible();
      
      // Recommendations
      const recommendations = habitsPage.getByTestId('productivity-recommendations');
      await expect(recommendations).toBeVisible();
      
      const recommendationCards = recommendations.getByTestId('recommendation-card');
      expect(await recommendationCards.count()).toBeGreaterThan(0);
      
      const firstRecommendation = recommendationCards.first();
      await expect(firstRecommendation.getByTestId('recommendation-title')).toBeVisible();
      await expect(firstRecommendation.getByTestId('recommendation-description')).toBeVisible();
      await expect(firstRecommendation.getByTestId('expected-impact')).toBeVisible();
    });

    test('should support writing goals and milestone tracking', async () => {
      // This test will FAIL - goals system doesn't exist yet
      await storyPage.page.goto(`/stories/${testStoryId}/goals`);
      
      const goalsPage = storyPage.page.getByTestId('writing-goals-page');
      await expect(goalsPage).toBeVisible();
      
      // Create new goal
      const createGoalButton = goalsPage.getByTestId('create-goal-button');
      await createGoalButton.click();
      
      const goalModal = storyPage.page.getByTestId('create-goal-modal');
      await expect(goalModal).toBeVisible();
      
      // Goal types
      const goalTypeSelector = goalModal.getByTestId('goal-type-selector');
      await goalTypeSelector.click();
      
      await expect(storyPage.page.getByTestId('goal-type-word-count')).toBeVisible();
      await expect(storyPage.page.getByTestId('goal-type-chapters')).toBeVisible();
      await expect(storyPage.page.getByTestId('goal-type-daily-writing')).toBeVisible();
      await expect(storyPage.page.getByTestId('goal-type-completion-date')).toBeVisible();
      
      await storyPage.page.getByTestId('goal-type-word-count').click();
      
      // Goal details
      await goalModal.getByTestId('goal-title-input').fill('Complete First Draft');
      await goalModal.getByTestId('target-word-count-input').fill('80000');
      await goalModal.getByTestId('goal-deadline-input').fill('2024-12-31');
      
      await goalModal.getByTestId('create-goal-button').click();
      
      await expect(storyPage.page.getByText('Writing goal created')).toBeVisible();
      
      // Goal should appear in the list
      const goalsList = goalsPage.getByTestId('goals-list');
      await expect(goalsList.getByText('Complete First Draft')).toBeVisible();
      
      // Goal progress tracking
      const goalCard = goalsList.getByTestId('goal-card').first();
      await expect(goalCard.getByTestId('progress-bar')).toBeVisible();
      await expect(goalCard.getByTestId('progress-percentage')).toBeVisible();
      await expect(goalCard.getByTestId('days-remaining')).toBeVisible();
      await expect(goalCard.getByTestId('daily-target')).toBeVisible();
    });

    test('should provide AI-powered writing schedule optimization', async () => {
      // This test will FAIL - schedule optimization doesn't exist yet
      await storyPage.page.goto(`/stories/${testStoryId}/schedule`);
      
      const schedulePage = storyPage.page.getByTestId('writing-schedule-page');
      await expect(schedulePage).toBeVisible();
      
      // Current schedule
      const currentSchedule = schedulePage.getByTestId('current-writing-schedule');
      await expect(currentSchedule).toBeVisible();
      
      const scheduleSlots = currentSchedule.getByTestId('schedule-slot');
      expect(await scheduleSlots.count()).toBeGreaterThan(0);
      
      // AI optimization button
      const optimizeButton = schedulePage.getByTestId('optimize-schedule-button');
      await optimizeButton.click();
      
      const optimizationModal = storyPage.page.getByTestId('schedule-optimization-modal');
      await expect(optimizationModal).toBeVisible();
      
      // Optimization factors
      await expect(optimizationModal.getByTestId('productivity-patterns-factor')).toBeVisible();
      await expect(optimizationModal.getByTestId('goal-deadlines-factor')).toBeVisible();
      await expect(optimizationModal.getByTestId('availability-factor')).toBeVisible();
      
      // Generate optimized schedule
      await optimizationModal.getByTestId('generate-optimized-schedule').click();
      
      // Wait for AI processing
      await expect(storyPage.page.getByText('Analyzing your writing patterns...')).toBeVisible();
      await expect(storyPage.page.getByText('Schedule optimized successfully')).toBeVisible();
      
      // Optimized schedule recommendations
      const optimizedSchedule = optimizationModal.getByTestId('optimized-schedule');
      await expect(optimizedSchedule).toBeVisible();
      
      const optimizedSlots = optimizedSchedule.getByTestId('optimized-slot');
      expect(await optimizedSlots.count()).toBeGreaterThan(0);
      
      // Each optimized slot should show expected productivity
      const firstSlot = optimizedSlots.first();
      await expect(firstSlot.getByTestId('time-slot')).toBeVisible();
      await expect(firstSlot.getByTestId('expected-productivity')).toBeVisible();
      await expect(firstSlot.getByTestId('confidence-score')).toBeVisible();
      
      // Apply optimized schedule
      await optimizationModal.getByTestId('apply-optimized-schedule').click();
      
      await expect(storyPage.page.getByText('Writing schedule updated')).toBeVisible();
    });
  });
});