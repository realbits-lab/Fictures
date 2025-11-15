import fs from 'fs';

// 1. Load authentication data
const authData = JSON.parse(fs.readFileSync('.auth/user.json', 'utf-8'));
const writerApiKey = authData.profiles.writer.apiKey;

// 2. Call the API
const sceneId = "scene_test_comics_1763203946675"; // From test setup
const API_BASE_URL = "http://localhost:3000";

console.log("Testing comic generation API...");
console.log("Scene ID:", sceneId);
console.log("API Key:", writerApiKey.substring(0, 20) + "...");

const response = await fetch(`${API_BASE_URL}/api/studio/scenes/${sceneId}/comic/generate`, {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "x-api-key": writerApiKey,
  },
  body: JSON.stringify({
    targetPanelCount: 3,
    regenerate: false,
  }),
});

console.log("Response status:", response.status);
console.log("Response headers:", Object.fromEntries(response.headers.entries()));

const text = await response.text();
console.log("Response body:", text);

