# Scripts Directory

This directory contains utility scripts for testing and working with the Fictures application.

## Story Generation and Download Scripts

### test-story-download.mjs

Complete end-to-end test that generates a new story and downloads it.

**Usage:**
```bash
dotenv --file .env.local run node scripts/test-story-download.mjs
```

**What it does:**
1. Generates a cyberpunk detective story using the HNS API
2. Monitors generation progress via Server-Sent Events
3. Downloads the complete story package as a ZIP file
4. Saves to `downloads/` directory

**Output:**
- Real-time progress updates in console
- Full log saved to `logs/test-story-download.log`
- ZIP file in `downloads/story_{id}_{timestamp}.zip`

### download-story.mjs

Downloads an existing story by ID.

**Usage:**
```bash
dotenv --file .env.local run node scripts/download-story.mjs <story-id>
```

**Example:**
```bash
dotenv --file .env.local run node scripts/download-story.mjs abc123def456
```

**What it does:**
1. Fetches story data from the database
2. Downloads all content (scenes, characters, settings, images)
3. Packages everything into a ZIP file
4. Saves to `downloads/` directory

**Output:**
- ZIP file in `downloads/story_{id}_{timestamp}.zip`

## Authentication Scripts

### capture-auth-manual.mjs

Captures Google OAuth authentication for Playwright testing.

**Usage:**
```bash
dotenv --file .env.local run node scripts/capture-auth-manual.mjs
```

**What it does:**
1. Opens a browser window
2. Prompts you to log in with manager@fictures.xyz
3. Captures authentication state
4. Saves to `.auth/user.json`

**When to use:**
- Setting up automated tests for the first time
- When authentication tokens have expired
- After clearing browser data

### test-auto-login.mjs

Tests that saved authentication credentials work.

**Usage:**
```bash
dotenv --file .env.local run node scripts/test-auto-login.mjs
```

**What it does:**
1. Loads authentication from `.auth/user.json`
2. Navigates to protected routes
3. Verifies access is granted

## Environment Requirements

All scripts require the following environment variables in `.env.local`:

```bash
# Authentication
AUTH_SECRET=your_secret
GOOGLE_CLIENT_ID=your_client_id
GOOGLE_CLIENT_SECRET=your_client_secret

# AI Integration
AI_GATEWAY_API_KEY=your_gateway_key

# Database
POSTGRES_URL=your_postgres_url

# Storage
BLOB_READ_WRITE_TOKEN=your_blob_token

# Optional: For API key authentication
TEST_API_KEY=your_test_api_key
```

## Output Directories

Scripts create the following directories:

- `downloads/` - Downloaded story packages (ignored by git)
- `logs/` - Script execution logs (ignored by git)
- `.auth/` - Authentication state for testing (ignored by git)

## Common Issues

### Authentication Errors

**Problem:** Script returns 401 Unauthorized

**Solutions:**
1. If using session auth: Log in to the app in your browser first
2. If using API key: Set `TEST_API_KEY` in `.env.local`
3. Re-run `capture-auth-manual.mjs` to refresh credentials

### Port Already in Use

**Problem:** Can't connect to localhost:3000

**Solutions:**
```bash
# Check what's running on port 3000
lsof -ti:3000

# Kill the process if needed
kill $(lsof -ti:3000)

# Start dev server
dotenv --file .env.local run pnpm dev
```

### Generation Fails

**Problem:** Story generation returns errors

**Solutions:**
1. Check AI_GATEWAY_API_KEY is valid
2. Verify database connection works
3. Check logs in `logs/dev-server.log`
4. Ensure sufficient API credits

### Download Package Empty or Missing Content

**Problem:** ZIP file is missing images or HNS data

**Solutions:**
1. Verify story generation completed successfully
2. Check blob storage configuration
3. Ensure images were generated (check story in database)
4. Review download API logs

## Development Tips

### Running Scripts in Background

All scripts can be run in background with output redirection:

```bash
dotenv --file .env.local run node scripts/test-story-download.mjs > logs/test.log 2>&1 &
```

### Monitoring Logs

```bash
# Follow log in real-time
tail -f logs/test-story-download.log

# View last 50 lines
tail -50 logs/test-story-download.log

# Search for errors
grep -i error logs/test-story-download.log
```

### Testing with Different Story Prompts

Edit `test-story-download.mjs` and modify the `STORY_PROMPT` constant:

```javascript
const STORY_PROMPT = `Your custom story idea here`;
```

## API Documentation

For complete API documentation, see:
- [Story Download API Documentation](../docs/STORY_DOWNLOAD_API.md)

## Contributing

When adding new scripts:

1. Add executable permissions: `chmod +x scripts/your-script.mjs`
2. Document usage in this README
3. Handle errors gracefully
4. Log to `logs/` directory
5. Use environment variables from `.env.local`
6. Follow the existing script patterns
