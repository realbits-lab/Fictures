# Claude Code Skills Setup

## Overview

Successfully migrated the story-generator skill to follow official Claude Code skill standards from https://docs.claude.com/en/docs/claude-code/skills

## What Changed

### Before: Single Markdown File
```
.claude/skills/story-generator.md  ❌ Incorrect format
```

### After: Proper Skill Directory
```
.claude/skills/
├── README.md                      ✅ Documentation
└── story-generator/              ✅ Skill directory
    └── SKILL.md                  ✅ Required file with YAML frontmatter
```

## Key Standards Applied

### 1. YAML Frontmatter (Required)

Every `SKILL.md` must start with:
```yaml
---
name: skill-name
description: What the skill does and when to use it
---
```

**Rules:**
- `name`: lowercase, numbers, hyphens only (max 64 chars)
- `description`: clear, specific (max 1024 chars)
- Include both WHAT and WHEN in description

### 2. Model-Invoked (Not User-Invoked)

Skills are **automatically activated** by Claude based on:
- User request context
- Skill description matching
- Available tools

Users don't explicitly call skills - they just make natural requests.

### 3. Focused Scope

Each skill should do ONE thing well:
- ✅ Good: "story-generator" for complete story creation
- ❌ Bad: "content-creator" for stories, articles, posts, etc.

### 4. Clear Descriptions

Description must help Claude discover when to activate:

**Before (vague):**
```yaml
description: Helps with story creation
```

**After (specific):**
```yaml
description: Generate complete AI-powered stories with parts, chapters, scenes, characters, and settings. Automatically publishes when user says "create". Use when user asks to generate, create, write, or make a story or fiction.
```

### 5. Progressive Disclosure

Claude only reads supporting files when needed. Structure helps performance:
```
story-generator/
├── SKILL.md              # Main instructions (always loaded)
├── EXAMPLES.md           # Loaded only when examples needed
├── TROUBLESHOOTING.md    # Loaded only when debugging
└── templates/            # Loaded only when templates needed
```

## Story Generator Skill

### Location
`.claude/skills/story-generator/SKILL.md`

### Activation Triggers

Claude activates this skill when user says:
- "generate a story..."
- "create a story..."
- "write a story..."
- "make a story..."
- Any story/fiction generation request

### Smart Publishing

The skill automatically determines publishing intent:
- **"create"** → Publishes to community
- **"generate"** or **"write"** → Draft only

### What It Generates

1. Story metadata (title, genre, premise, theme)
2. Parts (3-act structure)
3. Chapters (detailed specifications)
4. Scenes (complete content)
5. Characters (with AI-generated images)
6. Settings (with AI-generated images)

## How Skills Work

### Discovery
Skills are discovered from:
1. Personal skills: `~/.claude/skills/`
2. Project skills: `.claude/skills/` (shared via git)
3. Plugin skills: bundled with plugins

### Invocation
```
User Request → Claude analyzes context → Finds matching skill → Activates skill → Executes workflow
```

### Sharing
Project skills in `.claude/skills/` are automatically available to team members when they:
1. Pull latest code from git
2. Start/restart Claude Code

## File Structure Best Practices

### Minimal Skill
```
skill-name/
└── SKILL.md              # Everything in one file
```

### Complex Skill
```
skill-name/
├── SKILL.md              # Main instructions
├── REFERENCE.md          # Detailed reference
├── EXAMPLES.md           # Usage examples
├── scripts/              # Helper scripts
│   └── helper.sh
└── templates/            # Reusable templates
    └── template.txt
```

## Testing the Skill

### Verification Steps

1. **Check YAML syntax:**
```bash
head -5 .claude/skills/story-generator/SKILL.md
```

Should show:
```yaml
---
name: story-generator
description: Generate complete AI-powered stories...
---
```

2. **Restart Claude Code** - Skills load on startup

3. **Test natural requests:**
   - "Create a mystery story" → Should activate skill and publish
   - "Generate a sci-fi story" → Should activate skill (draft)
   - "Write a fantasy story" → Should activate skill (draft)

### Debug Mode

```bash
claude --debug
```

Shows:
- Which skills loaded successfully
- YAML parsing errors
- Skill activation decisions

## Migration Checklist

- ✅ Created proper directory structure
- ✅ Added YAML frontmatter to SKILL.md
- ✅ Updated description to be specific and actionable
- ✅ Documented activation triggers
- ✅ Added README.md for skills directory
- ✅ Updated CLAUDE.md with correct structure
- ✅ Removed old single-file format
- ✅ Tested skill activation

## Benefits of New Format

### 1. Better Discovery
Specific descriptions help Claude activate skills at the right time

### 2. Team Sharing
Project skills in git are automatically available to everyone

### 3. Performance
Progressive disclosure means Claude only loads what's needed

### 4. Maintainability
Clear structure makes skills easy to update and extend

### 5. Standards Compliance
Follows official Claude Code conventions

## Common Issues & Solutions

### Issue: Skill Not Activating

**Check:**
1. YAML frontmatter is valid (no tabs, proper quotes)
2. Description includes specific triggers
3. File is named `SKILL.md` (case-sensitive)
4. Directory name matches `name` field

### Issue: YAML Parse Error

**Fix:**
- Use spaces, not tabs
- Quote strings with special characters
- Check `---` delimiters are present

### Issue: Skill Loads But Wrong Behavior

**Fix:**
- Make description more specific
- Add clear activation triggers
- Include examples in SKILL.md

## Future Enhancements

Potential additions:
1. **EXAMPLES.md** - Comprehensive usage examples
2. **TROUBLESHOOTING.md** - Common issues and solutions
3. **templates/** - Story prompt templates
4. **scripts/** - Helper utilities

## Documentation References

- **Official Docs**: https://docs.claude.com/en/docs/claude-code/skills
- **Project Skills**: `.claude/skills/README.md`
- **CLAUDE.md**: Project-wide instructions
- **Story Generator**: `.claude/skills/story-generator/SKILL.md`

## Summary

The story-generator skill now follows official Claude Code standards:
- ✅ Proper directory structure
- ✅ YAML frontmatter with name and description
- ✅ Model-invoked (automatic activation)
- ✅ Clear, specific description with triggers
- ✅ Single, focused capability
- ✅ Shared via git for team access

Skills are now discoverable, maintainable, and automatically activated when needed!

---

**Updated:** October 25, 2025
**Format:** Claude Code Skills v1.0
**Compliance:** Full adherence to official standards
