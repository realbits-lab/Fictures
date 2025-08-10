import { test, expect } from '@playwright/test';
import { StoryPage } from '../pages/story';

test.describe('Story Creation Flow', () => {
  let storyPage: StoryPage;

  test.beforeEach(async ({ page }) => {
    storyPage = new StoryPage(page);
    await storyPage.navigateToCreateStory();
  });

  test('should display story creation form with all required fields', async () => {
    // This test will fail because story creation page doesn't exist yet
    await expect(storyPage.titleInput).toBeVisible();
    await expect(storyPage.descriptionTextarea).toBeVisible();
    await expect(storyPage.genreSelect).toBeVisible();
    await expect(storyPage.tagsInput).toBeVisible();
    await expect(storyPage.matureContentCheckbox).toBeVisible();
    await expect(storyPage.createButton).toBeVisible();
  });

  test('should validate required fields and show error messages', async () => {
    // This test will fail because story creation page doesn't exist yet
    await storyPage.createButton.click();
    
    await expect(storyPage.getErrorMessage('Title is required')).toBeVisible();
    await expect(storyPage.getErrorMessage('Description is required')).toBeVisible();
    await expect(storyPage.getErrorMessage('Genre is required')).toBeVisible();
  });

  test('should create a new story with valid data', async () => {
    // This test will fail because story creation page doesn't exist yet
    await storyPage.fillStoryForm({
      title: 'My Test Novel',
      description: 'This is a test novel created during e2e testing. It has a longer description to meet validation requirements.',
      genre: 'fantasy',
      tags: ['magic', 'adventure'],
      mature: false
    });

    await storyPage.createButton.click();
    
    // Should redirect to the story management page
    await expect(storyPage.page).toHaveURL(/\/stories\/[a-f0-9-]+$/);
    await expect(storyPage.getSuccessMessage('Story created successfully')).toBeVisible();
  });

  test('should handle tag input correctly', async () => {
    // This test will fail because story creation page doesn't exist yet
    await storyPage.addTag('magic');
    await storyPage.addTag('adventure');
    await storyPage.addTag('dragons');
    
    await expect(storyPage.getTag('magic')).toBeVisible();
    await expect(storyPage.getTag('adventure')).toBeVisible();
    await expect(storyPage.getTag('dragons')).toBeVisible();
    
    // Should be able to remove tags
    await storyPage.removeTag('adventure');
    await expect(storyPage.getTag('adventure')).not.toBeVisible();
    
    // Should enforce tag limit
    await storyPage.addTag('tag4');
    await storyPage.addTag('tag5');
    await storyPage.addTag('tag6'); // This should be rejected
    
    await expect(storyPage.getErrorMessage('Maximum 5 tags allowed')).toBeVisible();
  });

  test('should validate title length constraints', async () => {
    // This test will fail because story creation page doesn't exist yet
    await storyPage.titleInput.fill('AB'); // Too short
    await storyPage.createButton.click();
    
    await expect(storyPage.getErrorMessage('Title must be at least 3 characters')).toBeVisible();
    
    // Test maximum length
    await storyPage.titleInput.fill('A'.repeat(201)); // Too long
    await expect(storyPage.getErrorMessage('Title must be no more than 200 characters')).toBeVisible();
  });

  test('should validate description length constraints', async () => {
    // This test will fail because story creation page doesn't exist yet
    await storyPage.descriptionTextarea.fill('Short'); // Too short
    await storyPage.createButton.click();
    
    await expect(storyPage.getErrorMessage('Description must be at least 10 characters')).toBeVisible();
    
    // Test maximum length
    await storyPage.descriptionTextarea.fill('A'.repeat(1001)); // Too long
    await expect(storyPage.getErrorMessage('Description must be no more than 1000 characters')).toBeVisible();
  });

  test('should handle cover image upload', async () => {
    // This test will fail because story creation page doesn't exist yet
    await storyPage.uploadCoverImage('test-cover.jpg');
    
    await expect(storyPage.coverImagePreview).toBeVisible();
    await expect(storyPage.removeCoverButton).toBeVisible();
    
    // Should be able to remove uploaded image
    await storyPage.removeCoverButton.click();
    await expect(storyPage.coverImagePreview).not.toBeVisible();
  });

  test('should show loading state during story creation', async () => {
    // This test will fail because story creation page doesn't exist yet
    await storyPage.fillStoryForm({
      title: 'Loading Test Story',
      description: 'Testing the loading state during story creation process.',
      genre: 'sci-fi',
      tags: ['space'],
      mature: false
    });

    await storyPage.createButton.click();
    
    // Should show loading state
    await expect(storyPage.page.getByText('Creating...')).toBeVisible();
    await expect(storyPage.createButton).toBeDisabled();
    
    // Wait for creation to complete
    await storyPage.waitForStoryCreation();
  });

  test('should handle network errors gracefully', async () => {
    // This test will fail because story creation page doesn't exist yet
    // Simulate network failure
    await storyPage.page.route('**/api/stories', route => route.abort());
    
    await storyPage.fillStoryForm({
      title: 'Network Error Test',
      description: 'Testing error handling during story creation.',
      genre: 'mystery',
      tags: ['thriller'],
      mature: false
    });

    await storyPage.createButton.click();
    
    await expect(storyPage.getErrorMessage('Failed to create story. Please try again.')).toBeVisible();
    
    // Form should remain filled
    await expect(storyPage.titleInput).toHaveValue('Network Error Test');
  });

  test('should preserve form data when navigating away and back', async () => {
    // This test will fail because story creation page doesn't exist yet
    await storyPage.titleInput.fill('Draft Story');
    await storyPage.descriptionTextarea.fill('This is a draft that should be preserved.');
    await storyPage.selectGenre('romance');
    await storyPage.addTag('love');
    
    // Navigate away
    await storyPage.page.goto('/');
    
    // Navigate back
    await storyPage.navigateToCreateStory();
    
    // Form should be restored (assuming local storage implementation)
    await expect(storyPage.titleInput).toHaveValue('Draft Story');
    await expect(storyPage.descriptionTextarea).toHaveValue('This is a draft that should be preserved.');
  });

  test('should redirect to login if user is not authenticated', async ({ page }) => {
    // This test will fail because authentication check doesn't exist yet
    // Create a new page without authentication
    const unauthenticatedPage = await page.context().newPage();
    const unauthStoryPage = new StoryPage(unauthenticatedPage);
    
    await unauthStoryPage.navigateToCreateStory();
    
    // Should redirect to login page
    await expect(unauthenticatedPage).toHaveURL(/\/login/);
    await expect(unauthenticatedPage.getByText('Please log in to create a story')).toBeVisible();
  });
});