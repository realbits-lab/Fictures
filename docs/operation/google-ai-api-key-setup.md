---
title: Google Generative AI API Key Setup
---

# Google Generative AI API Key Setup

Complete guide to obtaining and configuring the `GOOGLE_GENERATIVE_AI_API_KEY` for the Fictures platform.

## Overview

The Fictures platform uses Google's Gemini API for:
- **Text Generation**: Novel content, scene writing, character profiles (Gemini 2.5 Flash & Flash Lite)
- **Image Generation**: Story covers, scene images, character portraits (Gemini 2.5 Flash Image)
- **Quality Evaluation**: Scene quality assessment and improvement suggestions

The API key enables access to these AI capabilities through the Vercel AI SDK.

---

## Method 1: Google AI Studio (Recommended)

**Best for**: Quick start, development, free tier access

### Steps

1. **Go to Google AI Studio**
   - Visit: https://aistudio.google.com/

2. **Sign In**
   - Sign in with your Google account
   - Accept terms of service if prompted

3. **Get API Key**
   - Click "Get API key" in the left sidebar
   - Or navigate directly to: https://aistudio.google.com/app/apikey

4. **Create API Key**
   - Click "Create API key"
   - Choose an existing Google Cloud project or create a new one
   - The API key will be generated automatically

5. **Copy and Store Key**
   - Copy the generated API key immediately
   - Store it securely (you won't be able to see it again)
   - Format: `AIza...` (39 characters)

### Advantages

- ✅ **Fast Setup**: Get started in minutes
- ✅ **Free Tier**: Generous free quota for development
- ✅ **Simple**: No Google Cloud setup required
- ✅ **Auto-enabled**: Gemini API enabled automatically

### Limitations

- Limited to Gemini API only
- Less control over billing and quotas
- Cannot integrate with other Google Cloud services easily

---

## Method 2: Google Cloud Console

**Best for**: Production deployment, advanced management, integration with other Google Cloud services

### Steps

1. **Go to Google Cloud Console**
   - Visit: https://console.cloud.google.com/

2. **Select or Create Project**
   - Click the project dropdown at the top
   - Select existing project or click "New Project"
   - Enter project name and click "Create"

3. **Enable Generative AI API**
   - Go to "APIs & Services" > "Library"
   - Search for "Generative Language API" or "Gemini API"
   - Click on the API and click "Enable"
   - Wait for the API to be enabled (takes a few seconds)

4. **Create API Credentials**
   - Go to "APIs & Services" > "Credentials"
   - Click "+ CREATE CREDENTIALS"
   - Select "API key"
   - A new API key will be generated

5. **Restrict API Key (Recommended)**

   For security, restrict the key:

   a. **Application Restrictions**:
   - Click "Edit API key" (pencil icon)
   - Under "Application restrictions":
     - For development: "None"
     - For production: "HTTP referrers (websites)" or "IP addresses"

   b. **API Restrictions**:
   - Under "API restrictions":
     - Select "Restrict key"
     - Choose "Generative Language API"
     - Click "Save"

6. **Copy and Store Key**
   - Copy the API key
   - Store it securely
   - Format: `AIza...` (39 characters)

### Advantages

- ✅ **Advanced Control**: Fine-grained IAM permissions
- ✅ **Better Security**: Restrict by API, IP, referrer
- ✅ **Production Ready**: Suitable for production deployments
- ✅ **Billing Management**: Detailed usage tracking and quotas
- ✅ **Integration**: Use with other Google Cloud services

### Additional Setup

**Enable Billing** (for production):
1. Go to "Billing" in Google Cloud Console
2. Link a billing account to your project
3. Set up budget alerts (recommended)

**Monitor Usage**:
1. Go to "APIs & Services" > "Dashboard"
2. View API usage metrics
3. Set up quota alerts

---

## Configuration

### Add to Environment Variables

**Development** (`.env.local`):
```bash
# Google Generative AI API Key
GOOGLE_GENERATIVE_AI_API_KEY=AIza...your-key-here

# Other required variables
DATABASE_URL=***                   # Neon PostgreSQL
BLOB_READ_WRITE_TOKEN=***          # Vercel Blob
```

**Production** (Vercel):
1. Go to Vercel Dashboard → Your Project
2. Settings → Environment Variables
3. Add `GOOGLE_GENERATIVE_AI_API_KEY`
4. Select environment: Production, Preview, Development
5. Save

### Verify Configuration

Run verification script:
```bash
dotenv --file .env.local run node -e "console.log('API Key:', process.env.GOOGLE_GENERATIVE_AI_API_KEY ? '✅ Set' : '❌ Missing')"
```

Test API connection:
```bash
dotenv --file .env.local run pnpm exec tsx scripts/generate-minimal-story.ts
```

---

## API Quotas & Limits

### Free Tier (Google AI Studio)

- **Requests**: 60 requests per minute
- **Tokens**: Varies by model
- **Rate Limits**: Generous for development

### Paid Tier (Google Cloud Console)

- **Higher Quotas**: Configurable per project
- **Pay-as-you-go**: Billed monthly
- **Rate Limits**: Adjustable based on needs

### Model-Specific Limits

| Model | Usage | Rate Limit (Free) |
|-------|-------|------------------|
| Gemini 2.5 Flash | Text generation | 60 RPM |
| Gemini 2.5 Flash Lite | Fast text generation | 60 RPM |
| Gemini 2.5 Flash Image | Image generation | 60 RPM |

**RPM** = Requests Per Minute

---

## Security Best Practices

### DO ✅

- Store API key in environment variables only
- Use `.env.local` for local development (gitignored)
- Restrict API key to specific APIs in Google Cloud Console
- Rotate API keys periodically
- Use separate keys for development and production
- Monitor API usage regularly
- Set up budget alerts

### DON'T ❌

- Never commit API keys to version control
- Never expose keys in client-side code
- Never share keys in documentation or Slack
- Never use production keys for development
- Never skip API restrictions in production

### If Key is Compromised

1. **Immediately revoke** the key in Google Cloud Console
2. **Generate new key** with proper restrictions
3. **Update environment variables** in all environments
4. **Review API usage** for unauthorized access
5. **Investigate** how the key was exposed

---

## Troubleshooting

### "API key not valid"

**Cause**: Invalid or expired API key

**Solution**:
1. Verify key format: `AIza...` (39 characters)
2. Check if key was copied completely
3. Regenerate key if needed

### "API not enabled"

**Cause**: Generative Language API not enabled for project

**Solution**:
1. Go to Google Cloud Console
2. APIs & Services → Library
3. Search "Generative Language API"
4. Click "Enable"

### "Quota exceeded"

**Cause**: Free tier rate limit reached

**Solutions**:
1. **Wait**: Rate limits reset after 1 minute
2. **Upgrade**: Switch to paid tier in Google Cloud Console
3. **Optimize**: Reduce API calls, implement caching

### "403 Forbidden"

**Cause**: API key restrictions blocking request

**Solutions**:
1. Check API restrictions in Google Cloud Console
2. Verify HTTP referrer or IP whitelist
3. Temporarily remove restrictions for testing

---

## Cost Estimation

### Free Tier

- Suitable for: Development, small projects
- Cost: $0/month
- Limits: 60 RPM, basic quotas

### Paid Tier

Estimated costs for Fictures platform:

| Operation | Model | Cost per 1K tokens | Estimated Monthly |
|-----------|-------|-------------------|-------------------|
| Novel Generation | Gemini 2.5 Flash | $0.075 input, $0.30 output | $5-20 |
| Image Generation | Gemini 2.5 Flash Image | $0.04 per image | $10-30 |
| Scene Evaluation | Gemini 2.5 Flash | $0.075 input, $0.30 output | $2-10 |

**Total Estimated**: $17-60/month for moderate usage

**Factors affecting cost**:
- Number of stories generated
- Story length and complexity
- Image generation frequency
- Evaluation iterations

---

## Related Documentation

- **Environment Architecture**: [environment-architecture.md](environment-architecture.md) - Multi-environment setup
- **Novel Generation**: [../novels/novels-development.md](../novels/novels-development.md) - How Gemini API is used
- **Image Generation**: [../image/image-generation.md](../image/image-generation.md) - Image generation with Gemini
- **Scripts**: [../../scripts/CLAUDE.md](../../scripts/CLAUDE.md) - Usage in scripts

---

## Quick Reference

```bash
# Generate API key
Google AI Studio: https://aistudio.google.com/app/apikey
Google Cloud Console: https://console.cloud.google.com/

# Set environment variable
echo "GOOGLE_GENERATIVE_AI_API_KEY=AIza...your-key" >> .env.local

# Verify
dotenv --file .env.local run node -e "console.log(process.env.GOOGLE_GENERATIVE_AI_API_KEY ? '✅ Set' : '❌ Missing')"

# Test
dotenv --file .env.local run pnpm exec tsx scripts/generate-minimal-story.ts
```

---

**Last Updated**: 2025-11-04
**Status**: ✅ Current
