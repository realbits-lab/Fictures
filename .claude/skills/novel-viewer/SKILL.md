---
name: novel-viewer
description: Generate interactive HTML viewer for novels with navigation, responsive design, and image galleries. Creates single-page application that opens in browser for reading. Use when user wants to view, read, or display a generated novel.
---

# Novel Viewer Skill

Generate beautiful, interactive HTML viewer for novels with full navigation, character/setting galleries, scene images, and responsive design. Opens automatically in browser for immersive reading experience.

## When to Use This Skill

Activate this skill when the user requests:
- "view my novel..."
- "create a viewer for..."
- "open the novel in browser..."
- "show me the story..."
- "display the novel..."
- "generate HTML for reading..."

## Core Features

### 1. Single-Page Application (SPA)
- **Pure HTML/CSS/JavaScript** - No build process, no dependencies
- **Fully embedded** - All styles and scripts in single file
- **Portable** - Copy HTML file anywhere, works offline
- **Fast** - Instant navigation, no page reloads

### 2. Responsive Design
- **Mobile-first** - Optimized for phone reading
- **Tablet-friendly** - Comfortable layout for medium screens
- **Desktop-enhanced** - Full sidebar navigation on large screens
- **Touch-enabled** - Swipe gestures for mobile navigation

### 3. Rich Navigation
- **Hierarchical menu** - Story → Parts → Chapters → Scenes
- **Character gallery** - Portraits with bios
- **Setting gallery** - Environment images with descriptions
- **Reading progress** - Auto-saves position in localStorage
- **Quick jump** - Table of contents for rapid navigation

### 4. Image Integration
- **Optimized variants** - Uses AVIF/JPEG variants from image-generator
- **Lazy loading** - Images load as needed for performance
- **Responsive images** - Correct size for device (mobile 1x/2x)
- **Fallbacks** - JPEG if AVIF not supported

### 5. Reading Experience
- **Dark/Light mode** - Toggle for comfortable reading
- **Typography** - Optimized for long-form reading
- **Print styles** - Beautiful printed output
- **Accessibility** - Semantic HTML, ARIA labels

## HTML Viewer Structure

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>[Story Title] - Interactive Viewer</title>

  <!-- Embedded CSS (mobile-first, responsive) -->
  <style>
    /* Base styles, typography, layout */
    /* Mobile styles (default) */
    /* Tablet styles (@media min-width: 768px) */
    /* Desktop styles (@media min-width: 1024px) */
    /* Print styles (@media print) */
  </style>
</head>
<body class="light-mode">
  <div class="app">
    <!-- Mobile header with hamburger menu -->
    <header class="mobile-header">
      <button class="menu-toggle" aria-label="Toggle menu">☰</button>
      <h1 class="story-title">[Story Title]</h1>
      <button class="theme-toggle" aria-label="Toggle theme">🌙</button>
    </header>

    <!-- Sidebar navigation (collapsible on mobile) -->
    <aside class="sidebar">
      <div class="sidebar-header">
        <h2>[Story Title]</h2>
        <button class="close-menu" aria-label="Close menu">✕</button>
      </div>

      <nav class="main-nav">
        <!-- Home -->
        <a href="#home" class="nav-item active">📖 Home</a>

        <!-- Parts & Chapters -->
        <div class="nav-section">
          <h3>Story</h3>
          <ul>
            <li>
              <a href="#part-1">📚 Part I: [Title]</a>
              <ul>
                <li><a href="#chapter-1">📝 Chapter 1: [Title]</a></li>
                <li><a href="#chapter-2">📝 Chapter 2: [Title]</a></li>
              </ul>
            </li>
            <li><a href="#part-2">📚 Part II: [Title]</a></li>
            <li><a href="#part-3">📚 Part III: [Title]</a></li>
          </ul>
        </div>

        <!-- Characters -->
        <div class="nav-section">
          <h3>Characters</h3>
          <ul>
            <li><a href="#character-1">👤 [Character 1]</a></li>
            <li><a href="#character-2">👤 [Character 2]</a></li>
          </ul>
        </div>

        <!-- Settings -->
        <div class="nav-section">
          <h3>Settings</h3>
          <ul>
            <li><a href="#setting-1">🏞️ [Setting 1]</a></li>
            <li><a href="#setting-2">🏞️ [Setting 2]</a></li>
          </ul>
        </div>
      </nav>
    </aside>

    <!-- Main content area -->
    <main class="content">
      <!-- Dynamic content inserted here by JavaScript -->
    </main>
  </div>

  <!-- Embedded JavaScript (SPA routing, data loading) -->
  <script>
    // Novel data (embedded JSON)
    const novelData = {
      metadata: { /* story metadata */ },
      structure: { /* parts, chapters */ },
      characters: [ /* character data */ ],
      settings: [ /* setting data */ ],
      scenes: [ /* scene content */ ]
    };

    // SPA router
    // View renderers (home, chapter, scene, character, setting)
    // Navigation handlers
    // Theme toggle
    // Reading progress tracking
  </script>
</body>
</html>
```

## Viewer Workflow

### Step 1: Load Novel Data

Read from `outputs/[story]/` directory:
- `metadata.json` - Story metadata
- `structure/` - Parts, chapters structure
- `chapters/` - Chapter markdown files with scenes
- `structure/characters.md` - Character profiles
- `structure/settings.md` - Setting descriptions
- `images/image-manifest.json` - Image URLs

### Step 2: Parse Content

Extract from markdown files:
1. **Story Overview**: Title, genre, summary, word count
2. **Parts**: Act titles and summaries
3. **Chapters**: Chapter titles and scene list
4. **Scenes**: Scene titles and full prose content
5. **Characters**: Names, traits, descriptions, image URLs
6. **Settings**: Names, descriptions, moods, image URLs

### Step 3: Build HTML Structure

Generate single HTML file with:
1. **Embedded CSS**: Responsive styles for all screen sizes
2. **Embedded Data**: JSON object with all novel content
3. **Embedded JavaScript**: SPA router and view renderers
4. **Image References**: Relative paths to image variants

### Step 4: Save and Open

1. Save HTML to `outputs/[story]/viewer/index.html`
2. Copy image directory to `outputs/[story]/viewer/images/`
3. Open in browser using playwright MCP tool
4. Navigate to `file:///[full-path]/index.html`

## View Types

### 1. Home View

```html
<div class="view home-view">
  <header class="story-header">
    <h1>[Story Title]</h1>
    <p class="genre">[Genre] | [Tone]</p>
  </header>

  <section class="story-summary">
    <h2>Summary</h2>
    <p>[Story summary text]</p>
  </section>

  <section class="story-stats">
    <h2>Statistics</h2>
    <div class="stats-grid">
      <div class="stat">
        <span class="stat-value">[N]</span>
        <span class="stat-label">Parts</span>
      </div>
      <div class="stat">
        <span class="stat-value">[M]</span>
        <span class="stat-label">Chapters</span>
      </div>
      <div class="stat">
        <span class="stat-value">[P]</span>
        <span class="stat-label">Scenes</span>
      </div>
      <div class="stat">
        <span class="stat-value">~[Q]</span>
        <span class="stat-label">Words</span>
      </div>
    </div>
  </section>

  <section class="story-characters">
    <h2>Characters</h2>
    <div class="character-grid">
      <div class="character-card">
        <img src="images/variants/character-1-mobile-1x.avif" alt="[Name]">
        <h3>[Character Name]</h3>
        <p>[Core Trait]</p>
      </div>
    </div>
  </section>

  <nav class="start-reading">
    <a href="#chapter-1" class="btn-primary">Start Reading →</a>
  </nav>
</div>
```

### 2. Chapter View

```html
<div class="view chapter-view">
  <header class="chapter-header">
    <nav class="breadcrumb">
      <a href="#home">Home</a> ›
      <a href="#part-1">Part I</a> ›
      <span>Chapter 1</span>
    </nav>
    <h1>[Chapter Title]</h1>
  </header>

  <div class="chapter-content">
    <!-- Scene 1 -->
    <article class="scene" id="scene-1-1">
      <header class="scene-header">
        <h2>[Scene Title]</h2>
      </header>

      <!-- Scene image (if available) -->
      <figure class="scene-image">
        <picture>
          <source srcset="images/variants/scene-1-1-mobile-1x.avif" type="image/avif">
          <img src="images/variants/scene-1-1-mobile-1x.jpg" alt="[Scene Title]">
        </picture>
      </figure>

      <!-- Scene prose content -->
      <div class="scene-prose">
        <p>[Scene paragraph 1]</p>
        <p>[Scene paragraph 2]</p>
        <!-- ... -->
      </div>
    </article>

    <!-- Scene 2 -->
    <article class="scene" id="scene-1-2">
      <!-- ... -->
    </article>
  </div>

  <!-- Navigation to next/previous chapter -->
  <nav class="chapter-nav">
    <a href="#chapter-prev" class="btn-secondary">← Previous</a>
    <a href="#chapter-next" class="btn-primary">Next →</a>
  </nav>
</div>
```

### 3. Character View

```html
<div class="view character-view">
  <header class="character-header">
    <nav class="breadcrumb">
      <a href="#home">Home</a> ›
      <a href="#characters">Characters</a> ›
      <span>[Character Name]</span>
    </nav>
  </header>

  <div class="character-profile">
    <!-- Character portrait -->
    <figure class="character-portrait">
      <picture>
        <source srcset="images/variants/character-1-mobile-2x.avif" type="image/avif">
        <img src="images/variants/character-1-mobile-2x.jpg" alt="[Character Name]">
      </picture>
    </figure>

    <div class="character-details">
      <h1>[Character Name]</h1>

      <section class="character-traits">
        <h2>Core Trait</h2>
        <p>[coreTrait]</p>

        <h2>Internal Flaw</h2>
        <p>[internalFlaw]</p>

        <h2>External Goal</h2>
        <p>[externalGoal]</p>
      </section>

      <section class="character-description">
        <h2>Description</h2>
        <p>[Physical description]</p>
        <p>[Backstory]</p>
      </section>

      <section class="character-relationships">
        <h2>Relationships</h2>
        <ul>
          <li>
            <strong>[Other Character]</strong>: [relationship type] (Jeong: [N]/10)
            <p>[current dynamic]</p>
          </li>
        </ul>
      </section>
    </div>
  </div>
</div>
```

### 4. Setting View

```html
<div class="view setting-view">
  <header class="setting-header">
    <nav class="breadcrumb">
      <a href="#home">Home</a> ›
      <a href="#settings">Settings</a> ›
      <span>[Setting Name]</span>
    </nav>
  </header>

  <div class="setting-profile">
    <!-- Setting environment image -->
    <figure class="setting-image">
      <picture>
        <source srcset="images/variants/setting-1-mobile-2x.avif" type="image/avif">
        <img src="images/variants/setting-1-mobile-2x.jpg" alt="[Setting Name]">
      </picture>
      <figcaption>[Setting Name]</figcaption>
    </figure>

    <div class="setting-details">
      <h1>[Setting Name]</h1>

      <section class="setting-description">
        <h2>Description</h2>
        <p>[Full setting description]</p>
      </section>

      <section class="setting-mood">
        <h2>Mood & Atmosphere</h2>
        <p><strong>Mood</strong>: [mood]</p>
        <p><strong>Emotional Resonance</strong>: [emotionalResonance]</p>
      </section>

      <section class="setting-adversity">
        <h2>Adversity Elements</h2>
        <h3>Physical Obstacles</h3>
        <ul>
          <li>[obstacle 1]</li>
          <li>[obstacle 2]</li>
        </ul>

        <h3>Social Dynamics</h3>
        <ul>
          <li>[dynamic 1]</li>
          <li>[dynamic 2]</li>
        </ul>
      </section>
    </div>
  </div>
</div>
```

## CSS Design System

### Color Palette

**Light Mode:**
```css
--bg-primary: #ffffff;
--bg-secondary: #f8f9fa;
--text-primary: #212529;
--text-secondary: #6c757d;
--accent: #0066cc;
--border: #dee2e6;
```

**Dark Mode:**
```css
--bg-primary: #1a1a1a;
--bg-secondary: #2d2d2d;
--text-primary: #e9ecef;
--text-secondary: #adb5bd;
--accent: #4dabf7;
--border: #495057;
```

### Typography

```css
--font-serif: Georgia, 'Times New Roman', serif;
--font-sans: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
--font-mono: 'SF Mono', Monaco, 'Courier New', monospace;

/* Scale */
--text-xs: 0.75rem;   /* 12px */
--text-sm: 0.875rem;  /* 14px */
--text-base: 1rem;    /* 16px */
--text-lg: 1.125rem;  /* 18px */
--text-xl: 1.25rem;   /* 20px */
--text-2xl: 1.5rem;   /* 24px */
--text-3xl: 1.875rem; /* 30px */
--text-4xl: 2.25rem;  /* 36px */
```

### Spacing

```css
--space-xs: 0.25rem;  /* 4px */
--space-sm: 0.5rem;   /* 8px */
--space-md: 1rem;     /* 16px */
--space-lg: 1.5rem;   /* 24px */
--space-xl: 2rem;     /* 32px */
--space-2xl: 3rem;    /* 48px */
--space-3xl: 4rem;    /* 64px */
```

## JavaScript Features

### SPA Router

```javascript
// Hash-based routing (no server required)
const router = {
  routes: {
    '#home': renderHome,
    '#part-:id': renderPart,
    '#chapter-:id': renderChapter,
    '#scene-:id': renderScene,
    '#character-:id': renderCharacter,
    '#setting-:id': renderSetting
  },

  navigate(hash) {
    const route = this.findRoute(hash);
    if (route) {
      route.handler(route.params);
      this.updateNavigation();
      this.saveReadingPosition();
    }
  },

  init() {
    window.addEventListener('hashchange', () => {
      this.navigate(window.location.hash);
    });

    // Initial navigation
    this.navigate(window.location.hash || '#home');
  }
};
```

### Reading Progress

```javascript
// Save/restore reading position
const progress = {
  save(hash) {
    localStorage.setItem('novel-progress', JSON.stringify({
      hash,
      timestamp: Date.now()
    }));
  },

  restore() {
    const saved = localStorage.getItem('novel-progress');
    if (saved) {
      const { hash } = JSON.parse(saved);
      return hash;
    }
    return '#home';
  }
};
```

### Theme Toggle

```javascript
// Dark/light mode toggle
const theme = {
  current: 'light',

  toggle() {
    this.current = this.current === 'light' ? 'dark' : 'light';
    document.body.classList.toggle('dark-mode');
    document.body.classList.toggle('light-mode');
    localStorage.setItem('novel-theme', this.current);
  },

  init() {
    const saved = localStorage.getItem('novel-theme');
    if (saved && saved !== this.current) {
      this.toggle();
    }
  }
};
```

## Response Templates

### Starting Generation

```
I'll create an interactive HTML viewer for your novel.

**Viewer Features:**
- 📖 Responsive design (mobile/tablet/desktop)
- 🎨 Dark/light mode toggle
- 📚 Full navigation (parts → chapters → scenes)
- 👥 Character gallery with portraits
- 🏞️ Setting gallery with images
- 🎬 Scene images inline with prose
- 💾 Reading progress auto-save
- 🖨️ Print-friendly styles

Loading novel data from outputs/[story]/...
```

### Progress Updates

```
✅ Loaded metadata
   - Title: [Story Title]
   - Genre: [Genre]
   - Chapters: [N]
   - Scenes: [M]

✅ Parsed characters ([N] profiles)
✅ Parsed settings ([M] locations)
✅ Loaded images ([P] originals, [Q] variants)

🎨 Generating HTML...
   - Embedded CSS (responsive, mobile-first)
   - Embedded JavaScript (SPA router)
   - Embedded data ([X] KB)

💾 Saving viewer to outputs/[story]/viewer/index.html
```

### Completion Report

```
✅ Viewer generated successfully!

**Output Location:**
outputs/[story]/viewer/index.html

**Viewer Contents:**
- Single HTML file (~[N] KB)
- Embedded styles (responsive)
- Embedded scripts (SPA)
- Embedded data (JSON)
- Image references ([M] variants)

**Features Included:**
✅ Responsive design (mobile/tablet/desktop)
✅ Dark/light mode toggle
✅ Full navigation menu
✅ Character gallery ([N] portraits)
✅ Setting gallery ([M] images)
✅ Scene images ([P] inline)
✅ Reading progress tracking
✅ Print-friendly styles

**Opening in browser...**

The viewer is now open and ready to read!

**Tips:**
- Bookmark for quick access
- Use arrow keys for navigation
- Toggle theme with moon/sun icon
- Print for physical reading
```

## Browser Integration

### Opening with Playwright

```javascript
// Use playwright MCP tool to open browser
const playwrightCommands = [
  'navigate to file:///[full-path]/viewer/index.html',
  'resize to 1280x800',
  'wait for navigation to complete'
];
```

### Fallback Methods

If playwright unavailable:
1. **macOS**: `open viewer/index.html`
2. **Linux**: `xdg-open viewer/index.html`
3. **Windows**: `start viewer/index.html`
4. **Manual**: Display path for user to copy/paste

## Best Practices

### 1. Performance Optimization

- **Lazy load images**: Only load when scrolling into view
- **Minimize HTML size**: Compress whitespace, optimize JSON
- **Cache data**: Store parsed data in memory
- **Debounce scroll**: Limit scroll event handlers

### 2. Accessibility

- **Semantic HTML**: Use proper heading hierarchy
- **ARIA labels**: Add labels for interactive elements
- **Keyboard navigation**: Tab through all links/buttons
- **Screen reader friendly**: Alt text for images

### 3. Mobile Experience

- **Touch-friendly**: Large tap targets (44×44px minimum)
- **Swipe gestures**: Navigate between chapters
- **Responsive images**: Serve correct size for device
- **Offline-ready**: All resources embedded or cached

### 4. Print Optimization

- **Page breaks**: Avoid breaking scenes across pages
- **Hidden elements**: Hide navigation in print
- **Black text**: Ensure legibility on paper
- **Image sizing**: Scale images appropriately

## Advanced Features

### 1. Search Functionality

Add text search within novel:
```javascript
function searchNovel(query) {
  const results = [];
  novelData.scenes.forEach(scene => {
    if (scene.content.includes(query)) {
      results.push({
        sceneId: scene.id,
        title: scene.title,
        excerpt: getExcerpt(scene.content, query)
      });
    }
  });
  return results;
}
```

### 2. Reading Statistics

Track reading stats:
```javascript
const stats = {
  startTime: Date.now(),
  chaptersRead: [],
  timePerChapter: {},

  trackProgress() {
    // Track reading speed, time per chapter
  }
};
```

### 3. Bookmarks

Allow users to bookmark scenes:
```javascript
const bookmarks = {
  list: JSON.parse(localStorage.getItem('bookmarks') || '[]'),

  add(sceneId, note) {
    this.list.push({ sceneId, note, timestamp: Date.now() });
    this.save();
  },

  save() {
    localStorage.setItem('bookmarks', JSON.stringify(this.list));
  }
};
```

### 4. Export Options

Generate exports:
- **PDF**: Print to PDF from browser
- **EPUB**: Convert HTML to EPUB format
- **TXT**: Extract plain text only
- **JSON**: Export data structure

## Troubleshooting

### Issue: Images Not Loading

**Symptoms**: Broken image icons or missing images

**Causes:**
- Image paths incorrect
- Images not copied to viewer directory
- Browser security blocking local files

**Solutions:**
- Verify images copied to `viewer/images/`
- Check relative paths in HTML
- Use browser's "Allow local file access" if needed

### Issue: Dark Mode Not Working

**Symptoms**: Theme toggle doesn't change appearance

**Causes:**
- localStorage not available
- CSS variables not set
- JavaScript error

**Solutions:**
- Check browser console for errors
- Verify CSS variables defined
- Test in different browser

### Issue: Navigation Broken

**Symptoms**: Clicking links doesn't change view

**Causes:**
- Hash navigation not working
- JavaScript router error
- Links have incorrect format

**Solutions:**
- Check console for JavaScript errors
- Verify hash format (#chapter-1)
- Test in different browser

## Technical Notes

- **File size**: ~200-500KB for small novels, ~1-2MB for large novels
- **Browser support**: Modern browsers (Chrome, Firefox, Safari, Edge)
- **Performance**: Instant navigation, <100ms render time
- **Offline**: Fully functional without internet
- **Security**: No external resources, safe for local use

## Related Skills

- `novel-generator`: Generate novels for viewing
- `novel-evaluator`: Assess quality before viewing
- `image-generator`: Create images for viewer
