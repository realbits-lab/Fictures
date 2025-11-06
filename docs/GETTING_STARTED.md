# Getting Started

**Complete setup guide for Fictures**

## Prerequisites

Before you begin, make sure you have:

- **Node.js 18+** - [Download here](https://nodejs.org/)
- **pnpm** - Install with `npm install -g pnpm`
- **PostgreSQL database** - We recommend [Neon](https://neon.tech) (free tier available)
- **Redis instance** - We recommend [Upstash](https://upstash.com) (free tier available)
- **Google OAuth credentials** - For user authentication
- **AI provider API key** - xAI, OpenAI, Anthropic, etc.

## Installation

### Step 1: Clone the Repository

```bash
git clone https://github.com/realbits-lab/Fictures.git
cd Fictures
```

### Step 2: Install Dependencies

```bash
pnpm install
```

This will install all dependencies for the Next.js app and any workspace packages.

### Step 3: Set Up Environment Variables

Copy the example environment file:

```bash
cp .env.example .env.local
```

Now edit `.env.local` and configure the following variables:

#### Authentication
```bash
# Generate with: openssl rand -base64 32
AUTH_SECRET=your-super-secret-auth-secret

# Google OAuth (get from Google Cloud Console)
GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-google-client-secret
```

#### AI Integration
```bash
# Direct provider keys
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...
XAI_API_KEY=xai-...
```

#### Database
```bash
# PostgreSQL connection (pooled for app)
DATABASE_URL=postgres://user:pass@host/db?pgbouncer=true

# Direct connection (for migrations)
DATABASE_URL_UNPOOLED=postgres://user:pass@host/db
```

#### Storage
```bash
# Vercel Blob for image storage
BLOB_READ_WRITE_TOKEN=vercel_blob_rw_...

# Redis for sessions and caching
REDIS_URL=redis://default:password@host:port
```

### Step 4: Set Up the Database

Generate migrations from the schema:
```bash
pnpm db:generate
```

Apply migrations to your database:
```bash
pnpm db:migrate
```

Or push schema directly (development only):
```bash
pnpm db:push
```

### Step 5: Run the Development Server

```bash
dotenv --file .env.local run pnpm dev
```

The app will be running at **http://localhost:3000** 🎉

## Database Commands

### Migrations
```bash
# Generate new migration from schema changes
pnpm db:generate

# Apply pending migrations
pnpm db:migrate

# Push schema directly to database (dev only, skips migrations)
pnpm db:push
```

### Database Studio
```bash
# Open Drizzle Studio to browse and edit data
pnpm db:studio
```

Drizzle Studio runs at **http://localhost:4983**

### Schema Management
The database schema is defined in:
- `src/lib/db/schema.ts` - Main schema file

When you make changes to the schema:
1. Run `pnpm db:generate` to create a migration
2. Review the migration in `drizzle/migrations/`
3. Run `pnpm db:migrate` to apply it

## Setting Up External Services

### Google OAuth

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a new project (or use existing)
3. Enable **Google+ API**
4. Go to **Credentials** → **Create Credentials** → **OAuth client ID**
5. Application type: **Web application**
6. Authorized redirect URIs:
   - `http://localhost:3000/api/auth/callback/google` (development)
   - `https://yourdomain.com/api/auth/callback/google` (production)
7. Copy **Client ID** and **Client Secret** to `.env.local`

### Neon PostgreSQL

1. Sign up at [neon.tech](https://neon.tech)
2. Create a new project
3. Copy the connection string
4. Use the **pooled** connection string for `DATABASE_URL`
5. Use the **direct** connection string for `DATABASE_URL_UNPOOLED`

### Upstash Redis

1. Sign up at [upstash.com](https://upstash.com)
2. Create a new Redis database
3. Choose a region close to your database
4. Copy the **Redis URL** to `.env.local`

### Vercel Blob Storage

1. Sign up at [vercel.com](https://vercel.com)
2. Create a new project
3. Go to **Storage** → **Create Database** → **Blob**
4. Copy the **Read Write Token** to `.env.local`

### Vercel AI Gateway (Optional but Recommended)

The AI Gateway provides:
- Unified API for multiple AI providers
- Rate limiting and cost controls
- Request logging and analytics
- Fallback providers

Setup:
1. Go to your Vercel project
2. Navigate to **Settings** → **AI Gateway**
3. Create a new gateway
4. Copy the API key to `.env.local`

## First Time Setup

### Create Your First User

1. Start the development server
2. Go to **http://localhost:3000**
3. Click **Sign In**
4. Choose **Sign in with Google**
5. Complete the OAuth flow

You're now logged in and ready to create stories!

### Create Your First Story

1. Navigate to **http://localhost:3000/writing**
2. Click **New Story**
3. Fill in the title, description, and genre
4. Click **Create Story**
5. Start adding chapters and scenes!

## Development Workflow

### Hot Reload
Next.js supports hot reload - changes to your code will automatically refresh the browser.

### Type Safety
We use TypeScript throughout. Run type checking:
```bash
pnpm type-check
```

### Linting
Check code style:
```bash
pnpm lint
```

Fix auto-fixable issues:
```bash
pnpm lint:fix
```

### Testing
Run end-to-end tests:
```bash
pnpm test
```

Run tests in UI mode:
```bash
npx playwright test --ui
```

## Troubleshooting

### Port Already in Use
If port 3000 is already in use:
```bash
# Kill the process
lsof -ti:3000 | xargs kill -9

# Or use a different port
PORT=3001 dotenv --file .env.local run pnpm dev
```

### Database Connection Issues
- Verify your `DATABASE_URL` is correct
- Check that your IP is whitelisted (for Neon)
- Ensure the database exists
- Try using the direct connection string

### OAuth Redirect Errors
- Verify redirect URIs in Google Cloud Console
- Check that `AUTH_SECRET` is set
- Ensure you're using the correct domain (localhost for dev)

### Module Not Found Errors
```bash
# Clear node_modules and reinstall
rm -rf node_modules
pnpm install
```

### AI API Not Working
- Verify your AI Gateway key is correct
- Check that you have credits/quota remaining
- Try using a direct provider key instead

## Next Steps

Now that you're set up:

1. **Explore the App** - Navigate through writing, reading, and community sections
2. **Read the Docs** - Check out [FEATURES.md](FEATURES.md) for all capabilities
3. **Build Something** - Create your first story and test the AI features
4. **Join the Community** - Visit [GitHub Discussions](https://github.com/realbits-lab/Fictures/discussions)

Happy writing! ✍️
