// Test script for Gemini image generation
import { google } from '@ai-sdk/google';
import { experimental_generateImage as generateImage } from 'ai';
import { put } from '@vercel/blob';
import { nanoid } from 'nanoid';

async function testImageGeneration() {
  try {
    console.log('🧪 Testing Gemini image generation...');
    console.log('GEMINI_API_KEY available:', !!process.env.GEMINI_API_KEY);

    // Test character image generation
    const characterPrompt = "A detailed portrait of a young wizard with curly hair and bright green eyes, wearing mystical robes. High quality digital art style, suitable for a story illustration.";

    console.log('🎨 Generating character image...');
    const characterResult = await generateImage({
      model: google.image('imagen-3.0-generate-002'),
      prompt: characterPrompt,
      aspectRatio: '1:1',
      providerOptions: {
        google: {
          personGeneration: 'allow_all',
        }
      }
    });

    console.log('✅ Character image generated successfully');

    // Test place image generation
    const placePrompt = "A scenic view of a magical forest where trees sing ancient melodies, with glowing crystals scattered throughout. High quality digital art style, cinematic landscape.";

    console.log('🎨 Generating place image...');
    const placeResult = await generateImage({
      model: google.image('imagen-3.0-generate-002'),
      prompt: placePrompt,
      aspectRatio: '1:1',
      providerOptions: {
        google: {
          personGeneration: 'dont_allow',
        }
      }
    });

    console.log('✅ Place image generated successfully');

    // Test Vercel Blob upload
    console.log('📤 Testing Vercel Blob upload...');
    const testFileName = `test/${nanoid()}.png`;
    const blob = await put(testFileName, characterResult.image.uint8Array, {
      access: 'public',
      contentType: 'image/png',
    });

    console.log('✅ Image uploaded to Vercel Blob:', blob.url);
    console.log('🎉 All tests passed!');

    return {
      success: true,
      characterImage: characterResult.image.base64,
      placeImage: placeResult.image.base64,
      blobUrl: blob.url
    };

  } catch (error) {
    console.error('❌ Test failed:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

// Run the test
testImageGeneration().then(result => {
  console.log('Test result:', result.success ? '✅ SUCCESS' : '❌ FAILED');
  process.exit(result.success ? 0 : 1);
});