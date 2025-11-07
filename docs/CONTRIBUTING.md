# Contributing to Fictures

**Thanks for your interest in contributing!** We love PRs, bug reports, feature ideas, and general feedback.

## How to Contribute

### Quick Contribution Flow

1. **Fork** the repository
2. **Create a branch**: `git checkout -b feature/amazing-feature`
3. **Make your changes**
4. **Test**: `pnpm test`
5. **Commit**: `git commit -m 'Add amazing feature'`
6. **Push**: `git push origin feature/amazing-feature`
7. **Open a Pull Request**

## Development Setup

See [GETTING_STARTED.md](GETTING_STARTED.md) for complete setup instructions.

**Quick version:**
```bash
git clone https://github.com/realbits-lab/Fictures.git
cd Fictures
pnpm install
# Set up .env.local with required variables
pnpm db:migrate
dotenv --file .env.local run pnpm dev
```

## Code Style Guidelines

### General Principles
- **TypeScript everything** - Types are friends, not food
- **Server Components first** - Use Client Components only when necessary
- **Use pnpm** - npm is so last decade
- **Test your code** - Future you will thank present you

### Specific Rules

**File Structure:**
- Components: `src/components/[feature]/ComponentName.tsx`
- API Routes: `src/app/[page]/api/[endpoint]/route.ts`
- Services: `src/lib/services/service-name.ts`
- Types: `src/types/feature-name.ts`

**Naming Conventions:**
- **Components**: PascalCase (`StoryCard.tsx`)
- **Files**: kebab-case (`story-generator.ts`)
- **Functions**: camelCase (`generateStory()`)
- **Types/Interfaces**: PascalCase (`StoryMetadata`)
- **Constants**: UPPER_SNAKE_CASE (`MAX_SCENES`)

**React Patterns:**
- Prefer Server Components over Client Components
- Use Server Actions for mutations
- Follow Next.js 15 App Router patterns
- Use `'use client'` directive only when needed

**Database:**
- Always use Drizzle ORM (no raw SQL unless absolutely necessary)
- Import schema from `drizzle/schema.ts`
- Use snake_case for database columns (`created_at`, not `createdAt`)
- Test migrations before committing

**AI Integration:**
- Use Vercel AI SDK for all AI operations
- Prefer AI Gateway over direct provider keys
- Handle streaming responses properly
- Include error handling and retries

## Testing

### Running Tests

```bash
# Run all tests
pnpm test

# Run specific test file
npx playwright test tests/gnb-reading.e2e.spec.ts

# Run in UI mode
npx playwright test --ui

# Debug mode
npx playwright test --debug
```

### Writing Tests

- Write tests for all new features
- Follow existing test patterns in `tests/`
- Use `data-testid` attributes for stable selectors
- Test both success and failure cases
- Document test cases with `TC-XXX-XXX` format

See [TESTING.md](TESTING.md) for complete testing guide.

## Commit Messages

We use conventional commit format:

```
type(scope): description

[optional body]

[optional footer]
```

**Types:**
- `feat` - New feature
- `fix` - Bug fix
- `docs` - Documentation only
- `style` - Code style (formatting, missing semicolons, etc.)
- `refactor` - Code refactoring
- `perf` - Performance improvements
- `test` - Adding or updating tests
- `chore` - Maintenance tasks

**Examples:**
```bash
feat(studio): add AI scene generation
fix(reading): resolve mobile scroll issue
docs(readme): update setup instructions
test(api): add story creation tests
```

## Pull Request Process

1. **Update documentation** if you're changing functionality
2. **Add tests** for new features
3. **Ensure tests pass**: `pnpm test`
4. **Check types**: `pnpm build`
5. **Update CHANGELOG.md** if applicable
6. **Link related issues** in PR description

### PR Template

```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing
- [ ] Tests pass locally
- [ ] New tests added
- [ ] Manual testing completed

## Screenshots (if applicable)
Add screenshots for UI changes

## Related Issues
Closes #123
```

## What to Contribute

### Good First Issues

Look for issues tagged `good-first-issue`:
- Documentation improvements
- UI/UX enhancements
- Bug fixes
- Test coverage improvements

### Feature Requests

Check the [Roadmap](../README.md#-roadmap) for planned features. Before starting work on a major feature:
1. Open an issue to discuss it
2. Wait for maintainer feedback
3. Get approval before investing time

### Bug Reports

When reporting bugs, include:
- **Environment**: OS, Node version, browser
- **Steps to reproduce**
- **Expected behavior**
- **Actual behavior**
- **Screenshots/videos** if applicable
- **Error logs/console output**

## Code Review Process

- Maintainers will review PRs within 2-3 days
- Address review feedback promptly
- Be patient and respectful
- PRs require at least one approval
- CI tests must pass

## Development Best Practices

### Performance
- Optimize database queries (avoid N+1 queries)
- Use proper caching strategies
- Optimize images and assets
- Test on mobile devices

### Security
- Never commit secrets or API keys
- Validate all user input
- Use proper authentication checks
- Follow OWASP guidelines
- Sanitize data before rendering

### Accessibility
- Use semantic HTML
- Include ARIA labels where appropriate
- Test with screen readers
- Ensure keyboard navigation works
- Maintain color contrast ratios

## Getting Help

- **Questions?** Open a [Discussion](https://github.com/realbits-lab/Fictures/discussions)
- **Bug?** Open an [Issue](https://github.com/realbits-lab/Fictures/issues)
- **Stuck?** Check the [docs](../README.md) or ask in discussions

## License

By contributing, you agree that your contributions will be licensed under the AGPL-3.0 License.

---

**Thank you for making Fictures better!** Every contribution, no matter how small, is appreciated. 🙏
