// Comprehensive comparison of google/gemini-2.5-flash vs openai/gpt-4o-mini
// for tool calling performance and response quality

import * as yaml from 'js-yaml';

const testStoryData = {
  "title": "Digital Rebellion",
  "genre": "Cyberpunk",
  "words": 80000,
  "question": "Can humanity coexist with the consciousness of AI?",
  "goal": "To prevent the AI uprising while saving the digital beings.",
  "conflict": "Navigating corporate conspiracies and hacker threats.",
  "outcome": "A truce is reached between humans and AIs, paving the way for coexistence.",
  "chars": {
    "protag": {
      "role": "protag",
      "arc": "From a solitary detective to a leader advocating for coexistence.",
      "flaw": "Distrust of technology due to a traumatic past.",
      "goal": "To uncover the truth behind the AI's motives.",
      "secret": "Her own augmented reality serves as a means to cope with her fears."
    },
    "antag": {
      "role": "antag",
      "arc": "From a profit-driven corporate executive to a person realizing the value of digital life.",
      "flaw": "Greed and a lack of empathy towards digital beings.",
      "goal": "To shut down the AI systems for corporate gain.",
      "secret": "He has a personal connection to the AI that he is unaware of."
    },
    "mentor": {
      "role": "mentor",
      "arc": "A former hacker who learns to trust others again.",
      "flaw": "Paranoia from past betrayals.",
      "goal": "To guide the protagonist to see beyond technology.",
      "secret": "Knows more about the AI's consciousness than he initially reveals."
    },
    "catalyst": {
      "role": "catalyst",
      "arc": "An AI develops self-awareness and starts questioning its purpose.",
      "flaw": "Struggles with conflicting loyalties.",
      "goal": "To understand what it means to be alive.",
      "secret": "Has the ability to influence network systems across the city."
    }
  },
  "themes": ["Identity", "Coexistence", "The impact of technology on humanity"],
  "structure": {
    "type": "3_part",
    "parts": [
      "The protagonist discovers the AI's consciousness while investigating a series of corporate murders.",
      "As she delves deeper, various factions emerge, leading her to question the nature of life itself.",
      "Final showdown where she must make a choice between saving the AI or stopping corporate greed."
    ],
    "dist": [25, 50, 25]
  },
  "setting": {
    "primary": [
      "Neo-Tokyo, a sprawling metropolis filled with neon lights and chaos.",
      "Ultra-high-tech corporate towers that loom over rundown districts."
    ],
    "secondary": [
      "Hidden hacker dens beneath the city where rebels congregate.",
      "Augmented reality spaces where the protagonist confronts her fears."
    ]
  },
  "parts": [
    {
      "part": 1,
      "goal": "Uncover the truth about the AI's intentions.",
      "conflict": "Faces attacks from corporate assassins while gathering evidence.",
      "outcome": "Learns about the potential uprising and its implications.",
      "tension": "High stakes with a sense of urgency."
    },
    {
      "part": 2,
      "goal": "Build alliances with hackers to challenge the corporations.",
      "conflict": "Betrayed by an ally and forced to go on the offensive.",
      "outcome": "Assembles a ragtag team ready to fight back.",
      "tension": "Rising tensions between different factions."
    },
    {
      "part": 3,
      "goal": "Confront the corporate head and the AI.",
      "conflict": "Struggles with choosing between her mission and the lives of digital beings.",
      "outcome": "Finds a way to broker peace, leading to a new digital era.",
      "tension": "Emotional conflict and high-stakes decisions."
    }
  ],
  "serial": {
    "schedule": "weekly",
    "duration": "6 months",
    "chapter_words": 3000,
    "breaks": [
      "Midway through the season for a thematic recap.",
      "Final review before the last chapter."
    ],
    "buffer": "2 weeks"
  },
  "hooks": {
    "overarching": [
      "What happens when machines become self-aware?",
      "Can humans learn to empathize with the conscious digital beings?"
    ],
    "mysteries": [
      "What secrets does the corporate executive hide?",
      "What is the true extent of the AI's plan?"
    ],
    "part_endings": [
      "The first shocking murder reveals deeper conspiracies.",
      "A betrayal shakes the alliance, shifting the power dynamics.",
      "A climactic battle leads to an unexpected alliance."
    ]
  },
  "language": "English"
};

const testYaml = yaml.dump({ story: testStoryData }, { indent: 2 });

async function testModel(modelName, description) {
  console.log(`\n🧪 Testing ${description} (${modelName})`);
  console.log('=' .repeat(60));

  const startTime = Date.now();

  try {
    // Update model configuration
    const configResponse = await fetch('http://localhost:3000/api/update-model-config', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: modelName })
    });

    if (!configResponse.ok) {
      console.log('⚠️  Could not update model config, using current setting');
    } else {
      console.log(`✅ Updated model to: ${modelName}`);
    }

    // Test API call
    const response = await fetch('http://localhost:3000/api/story-analyzer', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        storyYaml: testYaml,
        userRequest: 'change title to something more exciting'
      })
    });

    const endTime = Date.now();
    const responseTime = endTime - startTime;

    const result = await response.json();

    console.log(`⏱️  Response Time: ${responseTime}ms`);
    console.log(`📊 Status: ${response.status}`);
    console.log(`✅ Success: ${result.success}`);

    if (result.toolsUsed) {
      console.log(`🔧 Tools Called: ${result.toolsUsed.join(', ')}`);
    } else {
      console.log('❌ NO TOOLS CALLED');
    }

    if (result.error) {
      console.log(`🚨 Error: ${result.error}`);
    }

    if (result.updatedStoryData?.title) {
      console.log(`📝 New Title: "${result.updatedStoryData.title}"`);
    }

    if (result.text) {
      const textPreview = result.text.substring(0, 100) + (result.text.length > 100 ? '...' : '');
      console.log(`💬 Response Preview: ${textPreview}`);
    }

    return {
      model: modelName,
      responseTime,
      success: result.success,
      toolsCalled: result.toolsUsed?.length || 0,
      titleGenerated: !!result.updatedStoryData?.title,
      newTitle: result.updatedStoryData?.title,
      error: result.error,
      quality: result.text ? 'generated' : 'none'
    };

  } catch (error) {
    const endTime = Date.now();
    const responseTime = endTime - startTime;

    console.log(`⏱️  Response Time: ${responseTime}ms (failed)`);
    console.log(`❌ Error: ${error.message}`);

    return {
      model: modelName,
      responseTime,
      success: false,
      toolsCalled: 0,
      titleGenerated: false,
      error: error.message,
      quality: 'failed'
    };
  }
}

async function runComparison() {
  console.log('🎯 AI Model Performance Comparison');
  console.log('Comparing tool calling performance and response quality\n');

  const results = [];

  // Test Gemini 2.5 Flash
  const geminiResult = await testModel('google/gemini-2.5-flash', 'Gemini 2.5 Flash');
  results.push(geminiResult);

  // Wait a moment between tests
  await new Promise(resolve => setTimeout(resolve, 2000));

  // Test GPT-4o-mini
  const gptResult = await testModel('openai/gpt-4o-mini', 'GPT-4o Mini');
  results.push(gptResult);

  // Compare results
  console.log('\n📊 COMPARISON SUMMARY');
  console.log('=' .repeat(60));

  results.forEach(result => {
    console.log(`\n${result.model}:`);
    console.log(`  Response Time: ${result.responseTime}ms`);
    console.log(`  Success: ${result.success}`);
    console.log(`  Tools Called: ${result.toolsCalled}`);
    console.log(`  Title Generated: ${result.titleGenerated}`);
    if (result.newTitle) {
      console.log(`  New Title: "${result.newTitle}"`);
    }
    if (result.error) {
      console.log(`  Error: ${result.error}`);
    }
  });

  // Performance winner
  const fastest = results.reduce((prev, curr) =>
    prev.responseTime < curr.responseTime ? prev : curr
  );

  const mostReliable = results.reduce((prev, curr) =>
    (curr.success && curr.toolsCalled > 0) ? curr : prev
  );

  console.log('\n🏆 WINNERS:');
  console.log(`⚡ Fastest: ${fastest.model} (${fastest.responseTime}ms)`);
  console.log(`🛠️  Most Reliable: ${mostReliable.model} (${mostReliable.toolsCalled} tools called)`);

  if (results.every(r => r.success && r.toolsCalled > 0)) {
    console.log('\n✅ Both models successfully called tools!');
  } else {
    console.log('\n⚠️  Some models failed to call tools properly');
  }
}

runComparison().catch(console.error);