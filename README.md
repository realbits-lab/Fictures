<a href="https://github.com/realbits-lab/Fictures">
  <img alt="Fictures - AI-powered web novel platform with community features." src="app/(chat)/opengraph-image.png">
  <h1 align="center">Fictures</h1>
</a>

<p align="center">
    Fictures is an AI-powered web novel platform that combines content creation with vibrant community engagement features including forums, groups, contests, and gamification.
</p>

<p align="center">
  <a href="#features"><strong>Features</strong></a> ·
  <a href="#community-features"><strong>Community</strong></a> ·
  <a href="#model-providers"><strong>AI Models</strong></a> ·
  <a href="#deploy-your-own"><strong>Deploy</strong></a> ·
  <a href="#running-locally"><strong>Local Setup</strong></a>
</p>
<br/>

## Features

### Core Platform
- [Next.js 15](https://nextjs.org) App Router with experimental PPR
  - Advanced routing for seamless navigation and performance
  - React Server Components (RSCs) and Server Actions for server-side rendering
- **AI Integration**: Powered by [Vercel AI SDK](https://sdk.vercel.ai/docs)
  - Unified API for generating text, structured objects, and tool calls with LLMs
  - Hooks for building dynamic chat and generative user interfaces
  - Supports xAI (default), OpenAI, Fireworks, and other model providers
- [shadcn/ui](https://ui.shadcn.com)
  - Styling with [Tailwind CSS](https://tailwindcss.com)
  - Component primitives from [Radix UI](https://radix-ui.com) for accessibility and flexibility

### Content Creation
- **Bimodal Interface**: Chat conversations alongside interactive artifact canvas
- **Document Types**: Text, code, image, and sheet editors with real-time collaboration
- **Version Control**: Document versioning with visual diff modes
- **AI-Powered Writing**: Story generation, editing assistance, and creative tools
- **Rich Text Editor**: ProseMirror-based editor with advanced formatting

### Data & Authentication
- **Database**: [PostgreSQL](https://postgresql.org) with [Drizzle ORM](https://orm.drizzle.team)
- **File Storage**: [Vercel Blob](https://vercel.com/storage/blob) for efficient file storage
- **Authentication**: [NextAuth.js v5](https://authjs.dev) with Google OAuth authentication
- **Caching**: Redis for session storage and performance optimization

## Community Features

### Forum System
- **Categories & Threads**: Organized discussion spaces with hierarchical structure
- **Posts & Replies**: Rich text posting with threading and real-time updates
- **Moderation Tools**: AI-powered content moderation with human oversight
- **Search & Filtering**: Advanced search across all forum content

### Group Management
- **Public & Private Groups**: Create communities around genres, interests, or projects
- **Member Roles**: Flexible permission system with admin, moderator, and member roles
- **Group Activities**: Shared discussions, events, and collaborative projects
- **Discovery System**: Find groups based on interests and activity levels

### Contest System
- **Multi-Phase Contests**: Submission, voting, judging, and results phases
- **Automated Management**: Phase transitions and result calculations
- **Public & Judge Voting**: Community participation with expert judging options
- **Prize Distribution**: Automated badge and reward systems

### Gamification Engine
- **Achievement System**: 100+ achievements across writing, community, and platform activities
- **Experience & Levels**: XP earning system with level progression and unlocks
- **Leaderboards**: Multiple ranking systems (daily, weekly, monthly, category-specific)
- **Badges & Recognition**: Visual progression indicators and community status

### Collaboration Tools
- **Beta Reader Marketplace**: Match authors with qualified beta readers
- **Co-Authoring Projects**: Collaborative writing tools with shared editing
- **Writing Workshops**: Scheduled events with expert facilitators
- **Peer Review System**: Structured feedback and critique exchange

### Engagement Features
- **Notification System**: Real-time updates for all community activities
- **Following System**: Connect with other users and track their activities
- **Content Reporting**: Community-driven content moderation and safety
- **Mobile Responsive**: Full-featured mobile experience for all community tools

## Model Providers

Fictures ships with [xAI](https://x.ai) `grok-2-1212` as the default AI model for content generation. However, with the [Vercel AI SDK](https://sdk.vercel.ai/docs), you can switch LLM providers to [OpenAI](https://openai.com), [Anthropic](https://anthropic.com), [Cohere](https://cohere.com/), and [many more](https://sdk.vercel.ai/providers/ai-sdk-providers) with just a few lines of code.

## Deploy Your Own

You can deploy your own version of Fictures to Vercel with one click:

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fvercel%2Fai-chatbot&env=AUTH_SECRET&envDescription=Learn+more+about+how+to+get+the+API+Keys+for+the+application&envLink=https%3A%2F%2Fgithub.com%2Fvercel%2Fai-chatbot%2Fblob%2Fmain%2F.env.example&demo-title=AI+Chatbot&demo-description=An+Open-Source+AI+Chatbot+Template+Built+With+Next.js+and+the+AI+SDK+by+Vercel.&demo-url=https%3A%2F%2Fchat.vercel.ai&products=%5B%7B%22type%22%3A%22integration%22%2C%22protocol%22%3A%22ai%22%2C%22productSlug%22%3A%22grok%22%2C%22integrationSlug%22%3A%22xai%22%7D%2C%7B%22type%22%3A%22integration%22%2C%22protocol%22%3A%22storage%22%2C%22productSlug%22%3A%22neon%22%2C%22integrationSlug%22%3A%22neon%22%7D%2C%7B%22type%22%3A%22integration%22%2C%22protocol%22%3A%22storage%22%2C%22productSlug%22%3A%22upstash-kv%22%2C%22integrationSlug%22%3A%22upstash%22%7D%2C%7B%22type%22%3A%22blob%22%7D%5D)

## Running locally

You will need to use the environment variables [defined in `.env.example`](.env.example) to run Fictures locally. It's recommended you use [Vercel Environment Variables](https://vercel.com/docs/projects/environment-variables) for this, but a `.env` file is all that is necessary.

> Note: You should not commit your `.env` file or it will expose secrets that will allow others to control access to your various AI and authentication provider accounts.

1. Install Vercel CLI: `npm i -g vercel`
2. Link local instance with Vercel and GitHub accounts (creates `.vercel` directory): `vercel link`
3. Download your environment variables: `vercel env pull`

```bash
pnpm install
pnpm dev
```

Your Fictures application should now be running on [localhost:3000](http://localhost:3000).

## Testing

### Authentication Testing Setup

This project uses Playwright for testing with Google OAuth authentication. Follow these steps to set up authenticated testing:

**Method 1: Manual Capture (Recommended)**

**Step 1: Capture Authentication State**
Run the interactive authentication capture tool:
```bash
dotenv --file .env.local run node scripts/capture-auth-manual.mjs
```

This command will:
- Open a browser window for manual Google login
- Wait for you to complete authentication with test.user@example.com
- Automatically detect when login is complete
- Save authentication cookies to `.auth/user.json`
- Capture NextAuth.js session data and Google OAuth tokens

**Step 2: Test Automatic Login**
Verify the captured credentials work:
```bash
dotenv --file .env.local run node scripts/test-auto-login.mjs
```

**Step 3: Use in Playwright Tests**
```javascript
// In your Playwright test files
const { test, expect } = require('@playwright/test');

test.use({
  storageState: '.auth/user.json'
});

test('authenticated user can access stories', async ({ page }) => {
  await page.goto('http://localhost:3000/stories');
  // Test runs with Google authentication
});
```

**Method 2: Legacy Configuration**

**Step 1: Environment Configuration**
Create a `.env.test` file with your Google test credentials:
```bash
GOOGLE_TEST_EMAIL=your.email@gmail.com
GOOGLE_TEST_PASSWORD=your_password
```

**Step 2: Create Authentication State**
Generate the `user.json` file containing Google OAuth cookies:
```bash
# Interactive setup - opens browser and automates Google login
npx playwright test --project=manual-setup --headed
```

**Step 3: Run Authenticated Tests**
```bash
# Run tests using saved authentication state
npx playwright test --project=authenticated --headed

# Test specific authenticated features
npx playwright test tests/auth/storage-state-demo.test.ts --project=authenticated --headed

# Run all test projects
npx playwright test
```

### Test Projects

- **`manual-setup`**: Creates `user.json` with Google OAuth authentication  
- **`authenticated`**: Tests that use saved authentication from `user.json`
- **`e2e`**: End-to-end application tests
- **`routes`**: Route-specific functionality tests

### Test Commands
```bash  
# Basic test commands
pnpm test                           # Run all tests
npx playwright test --headed        # Run with browser visible
npx playwright test --debug         # Debug mode with inspector
npx playwright test --ui            # Interactive UI mode

# Authentication-specific commands  
npx playwright test --project=manual-setup --headed    # Create user.json
npx playwright test --project=authenticated --headed   # Use user.json
```

The authentication system bypasses Google's "browser not secure" detection using specialized Chrome configurations and automated form filling.
