# Authentication Credentials Management

This directory contains scripts for managing and validating authentication credentials in `.auth/user.json`.

## Scripts Overview

### 1. `generate-auth-credentials.mjs`
**Purpose**: Generate secure passwords and API keys for authentication profiles.

**Usage**:
```bash
# Generate credentials for all profiles in all environments
node scripts/generate-auth-credentials.mjs --all

# Generate for specific profile
node scripts/generate-auth-credentials.mjs --profile writer --env develop

# Preview changes without writing to file (dry-run)
node scripts/generate-auth-credentials.mjs --all --dry-run

# Output credentials only (no file update)
node scripts/generate-auth-credentials.mjs --output

# Generate for specific environment
node scripts/generate-auth-credentials.mjs --all --env main
```

**Options**:
- `--profile <name>` - Generate for specific profile (manager|writer|reader)
- `--all` - Generate for all profiles (default)
- `--env <name>` - Target environment (main|develop|all) [default: all]
- `--dry-run` - Preview changes without writing to file
- `--output` - Output credentials to console only (no file changes)
- `--help, -h` - Show help message

**Output**:
- Passwords: 24 characters with uppercase, lowercase, numbers, special chars
- API Keys: `fic_` + 16 random alphanumeric characters (including `-` and `_`)

---

### 2. `validate-auth-credentials.mjs`
**Purpose**: Validate passwords and API keys in `.auth/user.json` against security requirements.

**Usage**:
```bash
# Validate all credentials
node scripts/validate-auth-credentials.mjs

# Validate specific environment
node scripts/validate-auth-credentials.mjs --env develop

# Validate specific profile
node scripts/validate-auth-credentials.mjs --profile writer

# Show detailed validation results
node scripts/validate-auth-credentials.mjs --verbose

# Auto-fix invalid credentials (regenerate)
node scripts/validate-auth-credentials.mjs --fix

# Output as JSON (useful for automation)
node scripts/validate-auth-credentials.mjs --json > results.json
```

**Options**:
- `--env <name>` - Check specific environment (main|develop|all) [default: all]
- `--profile <name>` - Check specific profile (manager|writer|reader)
- `--fix` - Auto-fix invalid credentials (regenerate)
- `--verbose` - Show detailed validation results
- `--json` - Output results in JSON format
- `--help, -h` - Show help message

**Exit Codes**:
- `0` - All credentials valid
- `1` - One or more credentials invalid

---

## Validation Rules

### Password Requirements
- **Length**: Exactly 24 characters
- **Uppercase**: At least 1 uppercase letter (A-Z)
- **Lowercase**: At least 1 lowercase letter (a-z)
- **Numbers**: At least 1 digit (0-9)
- **Special**: At least 1 special character from `!@#$%^&*`
- **Strength**: Scores as "Strong" when all requirements met

### API Key Requirements
- **Format**: `fic_` prefix + 16 characters
- **Allowed Characters**: Alphanumeric (a-z, A-Z, 0-9) + `-` + `_`
- **Quality**:
  - **Good**: ≥70% unique characters (≥11/16)
  - **Fair**: ≥50% unique characters (≥8/16)
  - **Poor**: <50% unique characters (<8/16)
- **Security**: High entropy (~96 bits), no weak patterns

### Email Requirements
- **Format**: Valid email address format
- **Domain**: Should be `@fictures.xyz`

---

## Common Workflows

### Initial Setup
```bash
# 1. Generate credentials for all profiles
node scripts/generate-auth-credentials.mjs --all

# 2. Validate the generated credentials
node scripts/validate-auth-credentials.mjs --verbose

# 3. Verify all is valid
echo $?  # Should output 0 if valid
```

### Regenerate Specific Profile
```bash
# Regenerate writer credentials in develop environment
node scripts/generate-auth-credentials.mjs --profile writer --env develop

# Validate the change
node scripts/validate-auth-credentials.mjs --profile writer --env develop --verbose
```

### Security Audit
```bash
# Run full validation
node scripts/validate-auth-credentials.mjs --verbose

# Export results for reporting
node scripts/validate-auth-credentials.mjs --json > audit-$(date +%Y%m%d).json

# Check exit code for automation
if node scripts/validate-auth-credentials.mjs; then
  echo "All credentials valid"
else
  echo "Validation failed"
fi
```

### Auto-Fix Invalid Credentials
```bash
# Validate and automatically fix any issues
node scripts/validate-auth-credentials.mjs --fix

# Verify the fixes
node scripts/validate-auth-credentials.mjs --verbose
```

---

## Integration with CI/CD

### Pre-commit Hook
```bash
#!/bin/bash
# .git/hooks/pre-commit

# Validate credentials before commit
if [ -f "apps/web/.auth/user.json" ]; then
  node apps/web/scripts/validate-auth-credentials.mjs
  if [ $? -ne 0 ]; then
    echo "❌ Credential validation failed. Please fix before committing."
    exit 1
  fi
fi
```

### GitHub Actions
```yaml
name: Validate Credentials
on: [push, pull_request]

jobs:
  validate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - name: Validate auth credentials
        run: node apps/web/scripts/validate-auth-credentials.mjs
        working-directory: .
```

---

## Security Best Practices

### DO:
✅ Use scripts to generate credentials (never manually)
✅ Run validation before committing `.auth/user.json`
✅ Use `--dry-run` to preview changes before applying
✅ Store credentials securely (never commit to public repos)
✅ Regenerate credentials regularly (security hygiene)
✅ Use `--verbose` to understand validation failures

### DON'T:
❌ Manually edit passwords or API keys
❌ Reuse passwords across environments
❌ Use weak or predictable patterns
❌ Skip validation after regeneration
❌ Commit credentials to version control (unless encrypted)
❌ Share credentials in plain text

---

## File Structure

```
apps/web/
├── .auth/
│   └── user.json              # Authentication credentials (managed by scripts)
└── scripts/
    ├── generate-auth-credentials.mjs   # Generation script
    ├── validate-auth-credentials.mjs   # Validation script
    └── AUTH_CREDENTIALS_README.md      # This file
```

---

## Troubleshooting

### Issue: "API Key Quality: Poor"
**Cause**: API key has less than 70% unique characters (e.g., many repeated letters)
**Solution**: Regenerate the credentials - the random generation should produce better quality
```bash
node scripts/generate-auth-credentials.mjs --profile <name> --env <env>
```

### Issue: "Password strength: Medium or Weak"
**Cause**: Password missing required character types
**Solution**: The generation script always produces "Strong" passwords, so this indicates manual editing
```bash
node scripts/generate-auth-credentials.mjs --profile <name> --env <env>
```

### Issue: "Invalid email format"
**Cause**: Email doesn't match expected pattern
**Solution**: Email should be `<profile>@fictures.xyz` (e.g., `writer@fictures.xyz`)

### Issue: "API Key length incorrect"
**Cause**: API key doesn't have exactly 16 characters after `fic_` prefix
**Solution**: Regenerate using the script
```bash
node scripts/generate-auth-credentials.mjs --profile <name> --env <env>
```

---

## Advanced Usage

### Batch Operations
```bash
# Regenerate all credentials in one environment
node scripts/generate-auth-credentials.mjs --all --env develop

# Validate just the profiles you care about
node scripts/validate-auth-credentials.mjs --profile writer --profile manager
```

### Scripted Workflows
```bash
#!/bin/bash
# Example: Rotate all credentials

echo "🔄 Rotating all credentials..."

# Generate new credentials
node scripts/generate-auth-credentials.mjs --all

# Validate
if node scripts/validate-auth-credentials.mjs --verbose; then
  echo "✅ Credential rotation successful"
else
  echo "❌ Validation failed after rotation"
  exit 1
fi

# Sync with database (if needed)
dotenv --file .env.local run node scripts/setup-auth-users.mjs
```

### JSON Output Processing
```bash
# Extract specific data using jq
node scripts/validate-auth-credentials.mjs --json | \
  jq '.environments.develop.profiles.writer.password.strength'

# Count invalid credentials
node scripts/validate-auth-credentials.mjs --json | \
  jq '.summary.invalid'

# Export warnings to CSV
node scripts/validate-auth-credentials.mjs --json | \
  jq -r '.environments | to_entries[] | .value.profiles | to_entries[] |
    select(.value.overall.hasWarnings) |
    [.key, .value.overall.status] | @csv'
```

---

## Related Documentation

- **Authentication Setup**: `apps/web/CLAUDE.md` - Authentication testing section
- **Environment Architecture**: `docs/operation/environment-architecture.md`
- **User Setup**: `scripts/setup-auth-users.mjs` - Database user creation

---

## Script Maintenance

These scripts are production-ready and should be maintained with the same rigor as application code:

1. **Version Control**: All changes must be committed to git
2. **Testing**: Test scripts after modifications with `--dry-run`
3. **Documentation**: Update this README when adding features
4. **Security**: Never weaken security requirements
5. **Compatibility**: Ensure scripts work with Node.js 18+

---

**Last Updated**: 2025-11-07
**Maintained By**: Development Team
**Support**: See project CLAUDE.md for development guidelines
