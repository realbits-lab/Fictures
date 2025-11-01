#!/usr/bin/env node

import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.POSTGRES_URL);

async function checkScenesTable() {
  console.log('\n🔍 SCENES TABLE - GOAL, CONFLICT, OUTCOME ANALYSIS\n');
  console.log('='.repeat(80));

  // Get all scenes
  const scenes = await sql`SELECT * FROM scenes`;

  console.log(`\n📊 Total scenes in database: ${scenes.length}\n`);

  if (scenes.length > 0) {
    console.log('📋 Field Usage Analysis:\n');

    // Check goal field
    console.log('  goal:');
    const goalCount = scenes.filter(s => s.goal && s.goal.trim() !== '').length;
    console.log(`    Populated: ${goalCount}/${scenes.length}`);
    if (goalCount > 0) {
      const example = scenes.find(s => s.goal);
      console.log(`    Example: ${example.goal.substring(0, 100)}...`);
    }

    // Check conflict field
    console.log('\n  conflict:');
    const conflictCount = scenes.filter(s => s.conflict && s.conflict.trim() !== '').length;
    console.log(`    Populated: ${conflictCount}/${scenes.length}`);
    if (conflictCount > 0) {
      const example = scenes.find(s => s.conflict);
      console.log(`    Example: ${example.conflict.substring(0, 100)}...`);
    }

    // Check outcome field
    console.log('\n  outcome:');
    const outcomeCount = scenes.filter(s => s.outcome && s.outcome.trim() !== '').length;
    console.log(`    Populated: ${outcomeCount}/${scenes.length}`);
    if (outcomeCount > 0) {
      const example = scenes.find(s => s.outcome);
      console.log(`    Example: ${example.outcome.substring(0, 100)}...`);
    }

    // Check Novels-specific fields
    console.log('\n  Novels-specific fields:');
    const cyclePhaseCount = scenes.filter(s => s.cyclePhase && s.cyclePhase.trim() !== '').length;
    const emotionalBeatCount = scenes.filter(s => s.emotionalBeat && s.emotionalBeat.trim() !== '').length;
    const evaluationCount = scenes.filter(s => s.evaluationScore && s.evaluationScore > 0).length;

    console.log(`    cyclePhase populated:     ${cyclePhaseCount}/${scenes.length}`);
    console.log(`    emotionalBeat populated:  ${emotionalBeatCount}/${scenes.length}`);
    console.log(`    evaluationScore > 0:      ${evaluationCount}/${scenes.length}`);

    // Sample comparison
    if (scenes.length > 0) {
      console.log('\n  Sample scenes comparison:');
      scenes.slice(0, 3).forEach((scene, i) => {
        console.log(`\n    Scene ${i + 1}: ${scene.title}`);
        console.log(`    - goal:           ${scene.goal ? '✓ Has value' : '✗ Empty/null'}`);
        console.log(`    - conflict:       ${scene.conflict ? '✓ Has value' : '✗ Empty/null'}`);
        console.log(`    - outcome:        ${scene.outcome ? '✓ Has value' : '✗ Empty/null'}`);
        console.log(`    - cyclePhase:     ${scene.cyclePhase || 'null'}`);
        console.log(`    - emotionalBeat:  ${scene.emotionalBeat || 'null'}`);
      });
    }
  }

  console.log('\n' + '='.repeat(80));

  // Recommendation
  console.log('\n💡 RECOMMENDATION:\n');
  const goalCount = scenes.filter(s => s.goal && s.goal.trim() !== '').length;
  const conflictCount = scenes.filter(s => s.conflict && s.conflict.trim() !== '').length;
  const outcomeCount = scenes.filter(s => s.outcome && s.outcome.trim() !== '').length;

  if (goalCount === 0 && conflictCount === 0 && outcomeCount === 0) {
    console.log('  ✅ SAFE TO REMOVE: goal, conflict, outcome fields');
    console.log('     All three fields are empty/null across all scenes');
    console.log('     These are HNS-specific fields not used by Novels system\n');
  } else {
    console.log('  ⚠️  CAUTION: Some fields have data');
    console.log(`     goal: ${goalCount} populated`);
    console.log(`     conflict: ${conflictCount} populated`);
    console.log(`     outcome: ${outcomeCount} populated\n`);
  }
}

checkScenesTable().catch(console.error);
