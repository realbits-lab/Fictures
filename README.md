<a href="https://github.com/realbits-lab/Fictures">
  <img alt="Fictures - AI-powered story writing and reading platform" src="app/(chat)/opengraph-image.png">
  <h1 align="center">Fictures</h1>
</a>

<p align="center">
  <strong>Where writers meet AI, and stories come alive</strong>
</p>

<p align="center">
  <a href="#-the-vision"><strong>Vision</strong></a> ·
  <a href="#-platform-overview"><strong>Platform</strong></a> ·
  <a href="#-quick-start"><strong>Quick Start</strong></a> ·
  <a href="docs/API.md"><strong>API</strong></a> ·
  <a href="docs/TESTING.md"><strong>Testing</strong></a> ·
  <a href="#-roadmap"><strong>Roadmap</strong></a>
</p>

<br/>

## 🎯 The Vision

**Stories should be fun to write, thrilling to read, and awesome to share.**

Remember the last time you got lost in a good story? That feeling when you couldn't put it down, when you stayed up way too late because "just one more chapter"? That's what we're chasing.

**The problem:** Most writing platforms treat stories like documents. Boring. Readers treat stories like PDFs. Meh. Writers struggle alone with blank pages and self-doubt. Ouch.

**The Fictures way:** What if writing felt like playing a creative game? What if reading was so immersive you forget you're staring at a screen? What if your favorite stories had buzzing communities where fans theorize, debate, and geek out together?

We're building a platform where:
- **Writers** get an AI sidekick that actually understands narrative structure (not just word salad generation)
- **Readers** discover stories that feel like interactive experiences, not static text
- **Communities** gather around stories they love, creating theories, fan art, and inside jokes

Think Netflix meets Wattpad meets Discord, but for stories that deserve better than endless scrolling.

**Our promise:** Every feature we build should make storytelling more *fun*—not more complicated. If it's not delightful, we're doing it wrong.

**Current Status**: Production-ready and actually fun to use. The AI doesn't judge your plot holes. 🤖✨

## 📚 Platform Overview

**Fictures** is your all-in-one AI-powered storytelling platform. Write, publish, read, and connect—all in one place.

### For Writers: Your AI-Powered Writing Studio

- **🏗️ Structure Made Simple**: Organize stories into Parts → Chapters → Scenes (because nested folders are for files, not stories)
- **🤖 AI That Actually Helps**: Generate scenes, develop characters, analyze your writing, create images, and get suggestions that don't sound like a corporate memo
- **✍️ Rich Editor**: ProseMirror/TipTap-based editor that's actually pleasant to use
- **📅 Auto-Publishing**: Schedule releases like a pro (or set it and forget it)
- **📊 Analytics**: See what readers love (and what makes them click away)

### For Readers: Immersive Reading Experience

- **🎭 7 Genres**: Fantasy, Sci-Fi, Romance, Mystery, Thriller, Horror, Adventure
- **📖 Smart Reading**: Progress tracking, cross-device sync, immersive mode
- **💬 Engage**: Comment, rate, like—or just silently judge from afar

### For Communities: Connect & Collaborate

- **💭 Story Forums**: Dedicated discussion boards for theories, reviews, and fan excitement
- **🧵 Threaded Discussions**: Because flat comment sections are so 2010
- **👥 Moderation Tools**: Keep it friendly (or at least civil)

**Want the full feature list?** Check out [📋 FEATURES.md](docs/FEATURES.md) for all the glorious details.

## 🛠️ Tech Stack

**The Cool Stuff Under the Hood:**

- **Frontend**: Next.js 15 + React 19 + TypeScript (because we like our bugs caught at compile time)
- **AI**: Vercel AI SDK (OpenAI, Anthropic, Google, Fireworks—we're not picky)
- **Database**: PostgreSQL + Drizzle ORM (SQL but make it TypeScript)
- **Auth**: NextAuth.js v5 (Google OAuth + API keys)
- **Storage**: Vercel Blob + Redis
- **UI**: Tailwind CSS v4 + shadcn/ui + Radix UI
- **Editor**: TipTap (ProseMirror for mortals)

**Full tech breakdown**: [🔧 TECH_STACK.md](docs/TECH_STACK.md)

## 🚀 Quick Start

### 5 Minutes to Story Time

**Prerequisites**: Node.js 18+, pnpm, and coffee ☕

```bash
# Clone and install
git clone https://github.com/realbits-lab/Fictures.git
cd Fictures
pnpm install

# Set up environment (copy .env.example to .env.local and fill it out)
# You'll need: Google OAuth, AI Gateway key, Postgres, Redis

# Database setup
pnpm db:generate && pnpm db:migrate

# Launch!
dotenv --file .env.local run pnpm dev
```

**Visit** [http://localhost:3000](http://localhost:3000) and start writing! 🎉

**Need details?** Full setup guide: [📖 GETTING_STARTED.md](docs/GETTING_STARTED.md)

### Key Routes (Where to Go)

- **`/writing`** - Your writing studio (create and edit stories)
- **`/reading`** - Browse and read stories by genre
- **`/community`** - Join discussions, share theories
- **`/publish`** - Schedule automated releases
- **`/analytics`** - See how your stories perform

**First time here?** Check out [🎓 USER_GUIDE.md](docs/USER_GUIDE.md)

---

## 📚 Documentation

**Dive Deeper:**

- **[🏗️ Getting Started](docs/GETTING_STARTED.md)** - Complete setup and installation guide
- **[📋 All Features](docs/FEATURES.md)** - Comprehensive feature list
- **[🧪 Testing Guide](docs/TESTING.md)** - Playwright E2E tests, coverage, debugging
- **[🔧 Tech Details](apps/web/CLAUDE.md)** - Architecture, database, AI integration
- **[🤝 Contributing](docs/CONTRIBUTING.md)** - How to contribute (we love PRs!)

**Quick API Auth Methods:**
1. Session-based (NextAuth.js cookies)
2. API Keys (`X-API-Key` header)
3. Email/password (Credentials provider)

---

## 🗺️ Roadmap

**What's Coming Next** (Because we're never satisfied)

🎯 **Community & Social**: Writing contests, groups, following system, author profiles
🎮 **Gamification**: Achievements, XP levels, leaderboards (make writing addictive)
🤝 **Collaboration**: Beta reader marketplace, co-authoring, writing workshops
✍️ **Writing Tools**: Version control, writing goals, outline mode, research notes

**Want something specific?** Drop a feature request in [GitHub Issues](https://github.com/realbits-lab/Fictures/issues)!

---

## 🤝 Contributing

**We love PRs!** Fork it, branch it, code it, test it (`pnpm test`), commit it, push it, PR it. ✨

Full guidelines: [CONTRIBUTING.md](CONTRIBUTING.md)

**Quick style guide:**
- TypeScript everything (types are friends, not food)
- Server Components > Client Components
- Use pnpm (npm is so last decade)
- Follow Next.js 15 patterns
- Test your code (future you will thank present you)

---

## 📞 Support & Community

- 🐛 **Found a bug?** [GitHub Issues](https://github.com/realbits-lab/Fictures/issues)
- 💬 **Have questions?** [GitHub Discussions](https://github.com/realbits-lab/Fictures/discussions)
- 📖 **Need docs?** [Project Wiki](https://github.com/realbits-lab/Fictures/wiki)

---

## 📜 License

MIT License - see [LICENSE](LICENSE). TL;DR: Do what you want, just don't blame us. 😎

---

## 🙏 Built With

Next.js · Vercel AI SDK · Drizzle ORM · NextAuth.js · shadcn/ui · TipTap · PostgreSQL · Redis · Love & Coffee ☕

**By** [Realbits Lab](https://github.com/realbits-lab)

---

<p align="center">
  <strong>Made with ❤️ for writers and readers everywhere</strong><br/>
  <sub>Now go write that story you've been thinking about!</sub>
</p>
