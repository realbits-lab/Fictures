// Test with the actual story data from browser console logs

const realStoryData = {
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

// Convert to YAML format like the API expects
import * as yaml from 'js-yaml';

const realStoryYaml = yaml.dump({ story: realStoryData });

async function testWithRealData() {
  console.log('🧪 Testing with real browser story data...\n');
  console.log('📄 Story YAML (first 500 chars):', realStoryYaml.substring(0, 500) + '...\n');

  try {
    const response = await fetch('http://localhost:3000/api/story-analyzer', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        storyYaml: realStoryYaml,
        userRequest: 'change title'
      })
    });

    const result = await response.json();

    console.log('📊 Response Status:', response.status);
    console.log('✅ Success:', result.success);

    if (result.error) {
      console.log('🚨 Error:', result.error);
    }

    if (result.toolsUsed) {
      console.log('🔧 Tools Used:', result.toolsUsed);
    }

    if (result.text) {
      console.log('💬 AI Response:', result.text);
    }

    if (result.updatedStoryData?.title) {
      console.log('📝 New Title:', result.updatedStoryData.title);
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testWithRealData();