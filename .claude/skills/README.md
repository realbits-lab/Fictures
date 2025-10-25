# Claude Code Skills

This directory contains project-specific Claude Code skills that extend Claude's capabilities for the Fictures project.

## Available Skills

### story-generator

**Description:** Generate complete AI-powered stories with parts, chapters, scenes, characters, and settings.

**Usage:** Automatically activated when you ask Claude to generate, create, write, or make a story.

**Auto-publish:** Stories are automatically published when you use "create" instead of "generate".

**Examples:**
- "Create a mystery story about art theft" → Published story
- "Generate a sci-fi story about space" → Draft story
- "Write a fantasy adventure" → Draft story

**Location:** `.claude/skills/story-generator/`

## Skill Structure

Each skill is a directory containing:
- `SKILL.md` - Required file with YAML frontmatter and skill instructions
- Supporting files (optional) - Reference docs, templates, examples

## How Skills Work

Skills are **model-invoked** - Claude autonomously decides when to use them based on:
1. Your request context
2. The skill's description in SKILL.md
3. Available tools and resources

You don't need to explicitly invoke skills. Just make requests naturally, and Claude will activate the appropriate skill if needed.

## Adding New Skills

1. Create a new directory: `.claude/skills/your-skill-name/`
2. Add `SKILL.md` with YAML frontmatter:
   ```yaml
   ---
   name: your-skill-name
   description: What this skill does and when to use it
   ---
   ```
3. Add skill instructions and workflows
4. Commit to git to share with team

## Skill Best Practices

- **Clear descriptions**: Include both what and when in the description
- **Focused scope**: One skill per capability
- **Specific triggers**: Mention terms users would say
- **Complete instructions**: Include examples and error handling
- **Tool restrictions**: Use `allowed-tools` if needed for security

## Debugging Skills

If a skill isn't activating:
1. Check YAML syntax is valid
2. Ensure description is specific enough
3. Verify file structure is correct
4. Use `claude --debug` to see loading errors

## Documentation

- Official Docs: https://docs.claude.com/en/docs/claude-code/skills
- Fictures Skills: See individual SKILL.md files in each directory
- CLAUDE.md: Project-wide Claude Code instructions

## Team Sharing

Skills in this directory are automatically available to all team members when they:
1. Pull the latest code from git
2. Start or restart Claude Code

Changes to skills take effect when Claude Code restarts.
