import { expect, type Page, type Locator } from '@playwright/test';

export class StoryPage {
  // Form elements
  public readonly titleInput: Locator;
  public readonly descriptionTextarea: Locator;
  public readonly genreSelect: Locator;
  public readonly tagsInput: Locator;
  public readonly matureContentCheckbox: Locator;
  public readonly createButton: Locator;
  
  // Cover image elements
  public readonly coverImageUpload: Locator;
  public readonly coverImagePreview: Locator;
  public readonly removeCoverButton: Locator;
  
  // Story browsing elements
  public readonly storyGrid: Locator;
  public readonly searchInput: Locator;
  public readonly genreFilter: Locator;
  
  // Chapter elements
  public readonly chapterTitle: Locator;
  public readonly chapterContent: Locator;
  public readonly nextChapterButton: Locator;
  public readonly previousChapterButton: Locator;
  public readonly chapterNavigation: Locator;

  constructor(public readonly page: Page) {
    // Form elements
    this.titleInput = page.getByTestId('story-title-input');
    this.descriptionTextarea = page.getByTestId('story-description-textarea');
    this.genreSelect = page.getByTestId('story-genre-select');
    this.tagsInput = page.getByTestId('story-tags-input');
    this.matureContentCheckbox = page.getByTestId('story-mature-checkbox');
    this.createButton = page.getByTestId('create-story-button');
    
    // Cover image elements
    this.coverImageUpload = page.getByTestId('cover-image-upload');
    this.coverImagePreview = page.getByTestId('cover-image-preview');
    this.removeCoverButton = page.getByTestId('remove-cover-button');
    
    // Story browsing elements
    this.storyGrid = page.getByTestId('story-grid');
    this.searchInput = page.getByTestId('story-search-input');
    this.genreFilter = page.getByTestId('genre-filter');
    
    // Chapter elements
    this.chapterTitle = page.getByTestId('chapter-title');
    this.chapterContent = page.getByTestId('chapter-content');
    this.nextChapterButton = page.getByTestId('next-chapter-button');
    this.previousChapterButton = page.getByTestId('previous-chapter-button');
    this.chapterNavigation = page.getByTestId('chapter-navigation');
  }

  async navigateToCreateStory() {
    await this.page.goto('/stories/create');
  }

  async navigateToStoryBrowse() {
    await this.page.goto('/stories');
  }

  async navigateToStory(storyId: string) {
    await this.page.goto(`/stories/${storyId}`);
  }

  async navigateToChapter(storyId: string, chapterNumber: number) {
    await this.page.goto(`/stories/${storyId}/chapters/${chapterNumber}`);
  }

  async fillStoryForm(data: {
    title: string;
    description: string;
    genre: string;
    tags: string[];
    mature: boolean;
  }) {
    await this.titleInput.fill(data.title);
    await this.descriptionTextarea.fill(data.description);
    await this.selectGenre(data.genre);
    
    for (const tag of data.tags) {
      await this.addTag(tag);
    }
    
    if (data.mature) {
      await this.matureContentCheckbox.check();
    }
  }

  async selectGenre(genre: string) {
    await this.genreSelect.click();
    await this.page.getByTestId(`genre-option-${genre}`).click();
  }

  async addTag(tag: string) {
    await this.tagsInput.fill(tag);
    await this.tagsInput.press('Enter');
  }

  async removeTag(tag: string) {
    await this.page.getByTestId(`remove-tag-${tag}`).click();
  }

  getTag(tag: string) {
    return this.page.getByTestId(`tag-${tag}`);
  }

  getErrorMessage(message: string) {
    return this.page.getByText(message);
  }

  getSuccessMessage(message: string) {
    return this.page.getByText(message);
  }

  async uploadCoverImage(fileName: string) {
    const filePath = `tests/fixtures/${fileName}`;
    await this.coverImageUpload.setInputFiles(filePath);
  }

  async waitForStoryCreation() {
    await this.page.waitForResponse(response => 
      response.url().includes('/api/stories') && response.status() === 200
    );
  }

  // Story browsing methods
  async searchStories(query: string) {
    await this.searchInput.fill(query);
    await this.searchInput.press('Enter');
  }

  async filterByGenre(genre: string) {
    await this.genreFilter.selectOption({ value: genre });
  }

  getStoryCard(storyId: string) {
    return this.page.getByTestId(`story-card-${storyId}`);
  }

  async getStoryCards() {
    return this.page.getByTestId('story-card').all();
  }

  // Reading interface methods
  async navigateToNextChapter() {
    await this.nextChapterButton.click();
  }

  async navigateToPreviousChapter() {
    await this.previousChapterButton.click();
  }

  async getChapterList() {
    await this.chapterNavigation.click();
    return this.page.getByTestId('chapter-list-item').all();
  }

  async navigateToChapterFromList(chapterNumber: number) {
    await this.chapterNavigation.click();
    await this.page.getByTestId(`chapter-list-item-${chapterNumber}`).click();
  }

  async bookmarkStory(storyId: string) {
    const storyCard = this.getStoryCard(storyId);
    await storyCard.getByTestId('bookmark-button').click();
  }

  async likeStory(storyId: string) {
    const storyCard = this.getStoryCard(storyId);
    await storyCard.getByTestId('like-button').click();
  }

  async getReadingProgress() {
    return this.page.getByTestId('reading-progress');
  }

  async getCurrentChapterNumber() {
    const chapterNumberElement = await this.page.getByTestId('current-chapter-number').textContent();
    return chapterNumberElement ? parseInt(chapterNumberElement) : null;
  }

  async getTotalChapters() {
    const totalChaptersElement = await this.page.getByTestId('total-chapters').textContent();
    return totalChaptersElement ? parseInt(totalChaptersElement) : null;
  }

  // Story creation validation helpers
  async expectFormError(fieldName: string, errorMessage: string) {
    await expect(this.page.getByTestId(`${fieldName}-error`)).toContainText(errorMessage);
  }

  async expectFormSuccess() {
    await expect(this.page.getByTestId('success-message')).toBeVisible();
  }

  // Wait for page loads
  async waitForStoryBrowseLoad() {
    await this.storyGrid.waitFor();
    await expect(this.storyGrid).toBeVisible();
  }

  async waitForStoryLoad() {
    // Wait for either the story page or any page to load with a fallback
    try {
      // First try to wait for reading interface
      await this.chapterTitle.waitFor({ timeout: 5000 });
      await this.chapterContent.waitFor({ timeout: 5000 });
    } catch {
      // If reading interface isn't available, just wait for page load
      await this.page.waitForLoadState('domcontentloaded');
    }
  }

  async waitForChapterLoad() {
    await this.chapterContent.waitFor();
    await expect(this.chapterContent).toBeVisible();
  }

  // Authentication methods for Phase 2 tests
  async loginAsUser(userId: string) {
    // For Phase 2 tests, we'll simulate authentication by navigating to the login page
    // and setting the user ID in session storage
    await this.page.goto('/login');
    
    // Simulate user authentication by setting userId in storage
    await this.page.evaluate((userId) => {
      sessionStorage.setItem('test-user-id', userId);
      localStorage.setItem('test-user-id', userId);
    }, userId);
    
    // Navigate to home to establish session
    await this.page.goto('/');
    
    // Wait for any auth state to be established
    await this.page.waitForTimeout(500);
  }

  async loginAsAuthor(authorId: string) {
    await this.loginAsUser(authorId);
  }

  async loginAsReader(readerId: string) {
    await this.loginAsUser(readerId);
  }

  async logout() {
    await this.page.evaluate(() => {
      sessionStorage.clear();
      localStorage.clear();
    });
    await this.page.goto('/login');
  }
}