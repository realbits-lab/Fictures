#!/usr/bin/env node

/**
 * Generate Comic Panels Script
 *
 * Triggers comic panel generation for a scene via API endpoint.
 */

import fs from 'fs';
import path from 'path';

const sceneId = process.argv[2] || 'Kc5iFMCSL35CxbKbTJZlX';
const targetPanelCount = parseInt(process.argv[3]) || 8;

// Load API key from .auth/user.json (use writer profile for comic generation)
const authFilePath = path.join(process.cwd(), '.auth/user.json');
let apiKey = '';

try {
  const authData = JSON.parse(fs.readFileSync(authFilePath, 'utf-8'));
  // Use writer profile since scene belongs to writer@fictures.xyz
  apiKey = authData.profiles.writer.apiKey;
  console.log('✅ Loaded API key from .auth/user.json (writer profile)');
} catch (error) {
  console.error('❌ Failed to load API key from .auth/user.json');
  process.exit(1);
}

console.log('🎬 Starting comic panel generation...');
console.log(`   Scene ID: ${sceneId}`);
console.log(`   Target panels: ${targetPanelCount}`);
console.log('');

try {
  const response = await fetch('http://localhost:3000/api/comic/generate-panels', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      sceneId,
      targetPanelCount,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`HTTP ${response.status}: ${error}`);
  }

  // Stream SSE events
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n\n');
    buffer = lines.pop() || '';

    for (const line of lines) {
      if (line.startsWith('data: ')) {
        const data = JSON.parse(line.slice(6));

        if (data.type === 'start') {
          console.log(`🚀 ${data.message}`);
        } else if (data.type === 'progress') {
          console.log(`📊 Progress: ${data.current}% - ${data.status}`);
        } else if (data.type === 'complete') {
          console.log('\n✅ GENERATION COMPLETE!');
          console.log(`   Total panels: ${data.result.metadata.total_panels}`);
          console.log(`   Total time: ${(data.result.metadata.total_generation_time / 1000).toFixed(1)}s`);
          console.log(`   Reading time: ${data.result.metadata.estimated_reading_time}`);
          console.log(`   Total height: ${data.result.metadata.total_height}px`);
          console.log('');
          console.log('📋 Generated panels:');
          data.result.panels.forEach((panel, i) => {
            console.log(`   ${i + 1}. Panel ${panel.panel_number}: ${panel.shot_type}`);
            console.log(`      Image: ${panel.image_url}`);
          });
        } else if (data.type === 'error') {
          console.error('\n❌ ERROR:', data.error);
          process.exit(1);
        }
      }
    }
  }

  console.log('\n✨ Comic panel generation complete!');

} catch (error) {
  console.error('\n❌ Failed to generate comic panels:', error.message);
  process.exit(1);
}
