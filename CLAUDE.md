# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

- **Development**: `pnpm dev` - Starts Next.js development server with Turbo
- **Build**: `pnpm build` - Runs database migrations then builds the application
- **Linting**: `pnpm lint` - Runs Next.js ESLint and Biome linter with auto-fix
- **Formatting**: `pnpm format` - Formats code using Biome
- **Type checking**: No explicit typecheck command - use `pnpm build` to verify types

## Development Process Guidelines

When running the development server:
- Execute `pnpm dev` as a background process for continuous development
- Redirect output to a log file for monitoring and debugging purposes
- Check port 3000 availability before starting - if already in use, kill the existing process and restart

## Database Commands

- **Generate migrations**: `pnpm db:generate` - Generates Drizzle migrations
- **Run migrations**: `pnpm db:migrate` - Applies pending migrations
- **Database studio**: `pnpm db:studio` - Opens Drizzle Studio
- **Push schema**: `pnpm db:push` - Push schema changes directly to database
- **Pull schema**: `pnpm db:pull` - Pull schema from database

## Testing

- **Run tests**: `pnpm test` - Runs Playwright tests
- Test configuration in `playwright.config.ts` with projects for `e2e` and `routes` tests
- Tests located in `tests/` directory
- Playwright runs on port 3000 with a 240-second timeout

## Architecture Overview

This is a **Next.js 15 AI chatbot application** built with the following stack:

### Core Technologies
- **Framework**: Next.js 15 (App Router with PPR experimental feature)
- **Database**: PostgreSQL with Drizzle ORM
- **Authentication**: NextAuth.js v5 with credentials and guest user support
- **AI Integration**: Vercel AI SDK with xAI (Grok) as default provider
- **Styling**: Tailwind CSS with shadcn/ui components
- **File Storage**: Vercel Blob for file uploads
- **Caching**: Redis for session storage

### Project Structure

- **`app/`**: Next.js App Router structure
  - `(auth)/`: Authentication routes (login, register) with auth configuration
  - `(chat)/`: Main chat application with API routes and chat interface
- **`lib/`**: Shared utilities and configurations
  - `ai/`: AI model configurations, prompts, and tool definitions
  - `db/`: Database schema, migrations, and queries using Drizzle ORM
  - `editor/`: Rich text editor components and configurations
- **`components/`**: React components including UI components from shadcn/ui

### Database Schema

Key tables managed by Drizzle ORM:
- **Users**: Support for both regular and guest users
- **Chats**: Chat sessions with visibility settings
- **Messages**: Versioned message system (v2 schema with parts and attachments)
- **Documents**: Text, code, image, and sheet artifacts created during chats  
- **Votes**: User feedback on messages
- **Suggestions**: Document editing suggestions
- **Streams**: Chat streaming sessions

### Authentication

Dual authentication system:
- **Regular users**: Email/password authentication
- **Guest users**: Temporary accounts for anonymous usage

### AI Integration

- Default model: xAI Grok-2-1212
- Tool support for document creation/updates, weather, and suggestions
- Streaming responses with message parts architecture

### Key Configuration Files

- **`drizzle.config.ts`**: Database configuration pointing to `lib/db/schema.ts`
- **`biome.jsonc`**: Biome linting and formatting rules
- **`tailwind.config.ts`**: Custom color system and typography plugin
- **`next.config.ts`**: PPR experimental features and remote image patterns

## Environment Setup

Required environment variables (see `.env.example`):
- `AUTH_SECRET`: Authentication secret key  
- `XAI_API_KEY`: xAI API key for chat models
- `POSTGRES_URL`: PostgreSQL database connection
- `BLOB_READ_WRITE_TOKEN`: Vercel Blob storage token
- `REDIS_URL`: Redis connection for caching
- Use "dev.log" file in the root project directory for process output redirected file.