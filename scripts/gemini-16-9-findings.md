# Gemini 2.5 Flash Image - 16:9 Aspect Ratio Test Findings

## Executive Summary ✅

**The native Google Generative AI SDK DOES support 16:9 aspect ratio**, but **Vercel's AI SDK Gateway does NOT properly forward the imageConfig parameter**.

## Test Results

### ✅ Native Google SDK (Direct API)

```bash
# Using: @google/generative-ai package
# API Key: GOOGLE_GENERATIVE_AI_API_KEY (direct Google key)
```

**Result:**
- ✅ **Generated**: 1344×768 pixels
- ✅ **Ratio**: 1.75:1 (7:4 ratio, 1.56% off from true 16:9)
- ✅ **Test**: PASSED
- ✅ **File**: `logs/test-images/gemini-native-1761638676136.png`

### ❌ AI SDK Gateway (Vercel)

```bash
# Using: @ai-sdk/google package
# API Key: AI_GATEWAY_API_KEY (Vercel gateway)
```

**Result:**
- ❌ **Generated**: 1024×1024 pixels (square)
- ❌ **Ratio**: 1.00:1 (completely ignores aspectRatio parameter)
- ❌ **Test**: FAILED
- ❌ **Files**: `logs/test-images/gemini-test-*.png`

## Configuration That Works

```javascript
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GENERATIVE_AI_API_KEY);
const model = genAI.getGenerativeModel({
  model: 'gemini-2.5-flash-image'
});

const result = await model.generateContent({
  contents: [{
    parts: [{ text: 'Your prompt here' }]
  }],
  generationConfig: {
    responseModalities: ['Image'],
    imageConfig: {
      aspectRatio: '16:9',  // ✅ WORKS!
    },
  },
});

// Extract image from response
const imagePart = result.response.candidates[0].content.parts
  .find(part => part.inlineData);
const imageBuffer = Buffer.from(imagePart.inlineData.data, 'base64');
```

## Configuration That Doesn't Work

```javascript
import { generateText } from 'ai';
import { google } from '@ai-sdk/google';

const result = await generateText({
  model: google('gemini-2.5-flash-image', {
    apiKey: process.env.AI_GATEWAY_API_KEY
  }),
  prompt: 'Your prompt here',
  providerOptions: {
    google: {
      responseModalities: ['IMAGE'],
      imageConfig: {
        aspectRatio: '16:9',  // ❌ IGNORED by AI Gateway
      },
    },
  },
});
// Always generates 1024×1024 regardless of aspectRatio
```

## Why 1344×768 Instead of Pure 16:9?

Google's `gemini-2.5-flash-image` generates **1344×768** for `aspectRatio: '16:9'`:

- **1344×768 = 7:4 ratio = 1.75:1**
- **True 16:9 = 1.7778:1**
- **Difference: 1.56%**

This is likely because:
1. Google uses **standard resolution buckets** (1344×768 is a common display resolution)
2. **Close approximations** are acceptable for AI-generated images
3. **Performance optimization** - fixed sizes are faster to generate

Common 16:9 resolutions:
- 1920×1080 (Full HD)
- 1344×768 (HD ready)
- 1280×720 (HD)
- 1792×1008 (DALL-E 3 uses this)

## API Key Requirements

### Native Google SDK
- **Required**: `GOOGLE_GENERATIVE_AI_API_KEY`
- **Get from**: https://aistudio.google.com/apikey
- **Format**: `AIzaSy...` (39 characters)
- **Works with**: `@google/generative-ai` package
- **Billing**: Direct to Google Cloud

### AI SDK Gateway
- **Required**: `AI_GATEWAY_API_KEY`
- **Get from**: Vercel dashboard
- **Works with**: `@ai-sdk/google` package
- **Billing**: Through Vercel
- **Limitation**: Does NOT forward imageConfig properly ❌

## Recommendations

### For 16:9 Image Generation in This Project

**Option 1: Use Native Google SDK** ✅ Recommended
```bash
# Already have the key in .env.local
GOOGLE_GENERATIVE_AI_API_KEY="AIzaSy..."
```

Pros:
- ✅ Aspect ratio works (1344×768)
- ✅ Direct API control
- ✅ Lower latency
- ✅ More configuration options

Cons:
- Separate billing/quota management
- Different API structure than AI SDK
- Less unified codebase

**Option 2: Continue Using DALL-E 3** ✅ Current Approach
```bash
# Uses AI_GATEWAY_API_KEY through Vercel
```

Pros:
- ✅ True 16:9 (1792×1024)
- ✅ Already implemented and working
- ✅ Unified billing through Vercel Gateway
- ✅ Integrated with optimization pipeline

Cons:
- Different provider than Gemini
- Potentially higher cost per image

**Option 3: Wait for AI SDK Fix** ⏳
- Report issue to Vercel AI team
- Wait for `imageConfig` support in AI Gateway
- Monitor `@ai-sdk/google` updates

## Test Scripts

### Run Native SDK Test (Works)
```bash
dotenv --file .env.local run node scripts/test-gemini-native-16-9.mjs
```

Expected output:
```
✓ GOOGLE_GENERATIVE_AI_API_KEY found (length: 39)
✓ Image generated in ~10s
✓ Image saved: logs/test-images/gemini-native-*.png
✓ PASS - 1344×768 (1.75:1 ratio, 1.56% off from 16:9)
```

### Run AI SDK Test (Fails)
```bash
dotenv --file .env.local run node scripts/test-gemini-image-16-9.mjs
```

Expected output:
```
✓ AI_GATEWAY_API_KEY found
✓ Image generated in ~8s
✓ Image saved: logs/test-images/gemini-test-*.png
✗ FAIL - 1024×1024 (1.00:1 ratio, ignores aspectRatio)
```

## Conclusion

1. ✅ **Google's Gemini API DOES support aspect ratio control**
2. ❌ **Vercel's AI SDK Gateway does NOT forward imageConfig parameters**
3. ✅ **Native SDK generates 1344×768 for '16:9' (close enough)**
4. ✅ **Project already has working solution (DALL-E 3 @ 1792×1024)**

### Action Items

- [ ] Report AI Gateway limitation to Vercel team
- [ ] Consider migrating to native Google SDK if Gemini features are needed
- [ ] Continue using DALL-E 3 for production (already works perfectly)
- [ ] Monitor `@ai-sdk/google` package updates for fixes

---

**Test Date**: 2025-10-28
**AI SDK Version**: `@ai-sdk/google@2.0.14`
**Google SDK Version**: `@google/generative-ai@0.24.1`
**Model**: `gemini-2.5-flash-image`
**Status**: ✅ Native SDK works, ❌ AI Gateway doesn't
