# Fictures Documentation

Welcome to the Fictures documentation! This guide covers everything you need to know about building, deploying, and using the Fictures platform.

## What is Fictures?

Fictures is an AI-powered story writing platform built with Next.js 15 that helps writers create engaging novels and comics using the Adversity-Triumph Engine narrative framework.

## Key Features

- **Novel Generation**: AI-assisted story creation with the Adversity-Triumph Engine
- **Comic Creation**: Transform narratives into visual comic panels
- **Scene Quality Evaluation**: Automated scene quality assessment and improvement
- **Image Generation**: AI-generated character portraits and setting visuals
- **Community Sharing**: Publish and discover stories

## Quick Navigation

### Core Systems

- [Novels](/docs/novels/novels-specification) - Novel generation specification
- [Comics](/docs/comics/comics-architecture) - Comic system architecture
- [Scene System](/docs/scene/scene-evaluation-api) - Scene evaluation and quality pipeline
- [Images](/docs/image/image-architecture) - Image generation and optimization

### Development

- [UI Development](/docs/ui/ui-development) - UI components and patterns
- [Community](/docs/community/community-specification) - Community features
- [Studio](/docs/studio/studio-agent-chat) - Studio interface

### Research

- [AI-Assisted Development](/docs/research/AI-Assisted%20Specification-Driven%20Development) - Development methodology
- [Eliciting Reader Emotion](/docs/research/Eliciting%20Profound%20Reader%20Emotion) - Emotional storytelling

## Getting Started

1. Clone the repository
2. Install dependencies: `pnpm install`
3. Set up environment variables in `.env.local`
4. Run database migrations: `pnpm db:migrate`
5. Start development server: `dotenv --file .env.local run pnpm dev`

## Technology Stack

- **Framework**: Next.js 15 with App Router
- **Database**: PostgreSQL (Neon) with Drizzle ORM
- **AI**: Gemini 2.5 Flash & Flash Lite
- **Image Storage**: Vercel Blob
- **Styling**: Tailwind CSS v4
- **Authentication**: NextAuth.js v5

## Support

For issues or questions, please visit our [GitHub repository](https://github.com/realbits-lab/Fictures).
