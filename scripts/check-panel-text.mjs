#!/usr/bin/env node

import { db } from '../src/lib/db/index.js';
import { comicPanels } from '../src/lib/db/schema.js';
import { eq, asc } from 'drizzle-orm';

const sceneId = 'ag6v4reqZNsL7nS_xvoGh';

async function checkPanels() {
  const panels = await db.query.comicPanels.findMany({
    where: eq(comicPanels.sceneId, sceneId),
    orderBy: [asc(comicPanels.panelNumber)]
  });

  console.log('\n=== ALL PANELS ANALYSIS ===\n');

  panels.forEach(panel => {
    const hasNarrative = !!panel.narrative && panel.narrative.trim().length > 0;
    const hasDialogue = panel.dialogue && Array.isArray(panel.dialogue) && panel.dialogue.length > 0;

    console.log(`Panel ${panel.panelNumber}:`);
    console.log(`  Shot Type: ${panel.shotType}`);
    console.log(`  Has Narrative: ${hasNarrative}`);
    console.log(`  Has Dialogue: ${hasDialogue}`);
    console.log(`  Has EITHER: ${hasNarrative || hasDialogue ? 'YES ✓' : 'NO ✗'}`);

    if (hasNarrative) {
      console.log(`  Narrative: ${panel.narrative.substring(0, 60)}...`);
    }

    if (hasDialogue) {
      console.log(`  Dialogue count: ${panel.dialogue.length}`);
      panel.dialogue.forEach((d, i) => {
        console.log(`    [${i+1}] ${d.text?.substring(0, 50)}...`);
      });
    }

    if (!hasNarrative && !hasDialogue) {
      console.log('  ⚠️  PROBLEM: Panel has NO text overlay!');
    }

    console.log('');
  });

  const problemPanels = panels.filter(p => {
    const hasNarrative = !!p.narrative && p.narrative.trim().length > 0;
    const hasDialogue = p.dialogue && Array.isArray(p.dialogue) && p.dialogue.length > 0;
    return !hasNarrative && !hasDialogue;
  });

  console.log(`\n=== SUMMARY ===`);
  console.log(`Total panels: ${panels.length}`);
  console.log(`Panels with text: ${panels.length - problemPanels.length}`);
  console.log(`Panels WITHOUT text: ${problemPanels.length}`);

  if (problemPanels.length > 0) {
    console.log(`\nProblem panels: ${problemPanels.map(p => p.panelNumber).join(', ')}`);
  }

  process.exit(0);
}

checkPanels().catch(console.error);
