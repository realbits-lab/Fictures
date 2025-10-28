# Gemini 2.5 Flash Image - 16:9 Aspect Ratio Test Results

## Summary

Created test scripts to verify 16:9 aspect ratio support with Google's `gemini-2.5-flash-image` model via Vercel AI SDK Gateway.

## Test Scripts Created

### 1. `test-gemini-image-16-9.mjs` - AI SDK Test
- Uses `@ai-sdk/google` with Vercel AI Gateway
- Generates images using `generateText()` function
- Configures aspect ratio via `providerOptions.google.imageConfig.aspectRatio`
- Verifies dimensions using Sharp

### 2. `test-gemini-native-16-9.mjs` - Native SDK Test
- Uses `@google/generative-ai` SDK directly
- Bypasses AI SDK layer to test raw API
- Requires `GOOGLE_GENERATIVE_AI_API_KEY` (not AI Gateway key)

## Test Results

### ✅ What Works
- Image generation is successful
- Images are generated in ~7-11 seconds
- Response format is correct (images returned in `result.files` array)
- File saving and dimension verification works
- AI SDK Gateway integration is functional

### ❌ Current Limitation
- **Aspect ratio parameter is not being respected**
- All generated images are **1024×1024 (square)** regardless of `aspectRatio: '16:9'` setting
- Expected: 16:9 ratio images (e.g., 1792×1008 or similar)
- Actual: 1:1 ratio images (1024×1024)

## Configuration Tested

```javascript
await generateText({
  model: google('gemini-2.5-flash-image', { apiKey }),
  prompt: 'A serene mountain landscape at sunset...',
  providerOptions: {
    google: {
      responseModalities: ['IMAGE'],
      imageConfig: {
        aspectRatio: '16:9',  // ← NOT WORKING
      },
    },
  },
});
```

## Possible Causes

1. **AI SDK Issue**: The `@ai-sdk/google` package may not properly forward `imageConfig.aspectRatio` to Google's API
2. **Model Limitation**: The `gemini-2.5-flash-image` model may not support aspect ratio control yet
3. **API Gateway Issue**: Vercel's AI Gateway might not pass through image configuration parameters
4. **Configuration Structure**: The parameter structure might need to be different

## Documentation References

- **Google Docs**: Confirm that `gemini-2.5-flash-image` supports 10 aspect ratios (1:1, 16:9, 4:3, etc.)
- **AI SDK Docs**: Show `imageConfig.aspectRatio` parameter for image generation
- **Vercel AI Gateway**: Lists `gemini-2.5-flash-image-preview` as supported model

## Recommendations

### Short-term Solutions

1. **Use DALL-E 3** for 16:9 images (already working in this project)
   - See `src/lib/services/image-generation.ts`
   - Supports `1792x1024` (16:9) size parameter
   - Fully functional with optimization pipeline

2. **Post-process Gemini images** to 16:9
   - Generate at 1024×1024
   - Crop/resize to 1792×1008 using Sharp
   - Trade-off: May lose some content at edges

### Long-term Investigation

1. **Check AI SDK Updates**
   ```bash
   pnpm update @ai-sdk/google
   ```
   - Current version in project: `^2.0.14`
   - Check changelog for aspect ratio support

2. **Test with Direct Google API**
   - Requires setting up `GOOGLE_GENERATIVE_AI_API_KEY`
   - Would confirm if it's an AI SDK issue or Google API limitation

3. **Contact Vercel AI SDK Team**
   - Report aspect ratio parameter not working
   - Provide test script and results
   - GitHub: https://github.com/vercel/ai

4. **Try Alternative Models**
   - Test `gemini-2.0-flash-image` (if available)
   - Check if newer model versions support aspect ratio

## Usage

```bash
# Test with AI SDK (works, but square images)
dotenv --file .env.local run node scripts/test-gemini-image-16-9.mjs

# Test with native SDK (requires GOOGLE_GENERATIVE_AI_API_KEY)
dotenv --file .env.local run node scripts/test-gemini-native-16-9.mjs
```

## Generated Test Images

Test images are saved to: `logs/test-images/gemini-test-*.png`

All images are currently 1024×1024 pixels despite 16:9 configuration.

## Conclusion

While Gemini 2.5 Flash Image generation works through the AI SDK, **aspect ratio control is not functional** at this time. For production use with 16:9 requirements, continue using DALL-E 3 which reliably produces 1792×1024 images.

The test scripts are valuable for future testing when aspect ratio support is added or fixed.

---

**Date**: 2025-10-28
**AI SDK Version**: `@ai-sdk/google@2.0.14`
**Model**: `gemini-2.5-flash-image`
