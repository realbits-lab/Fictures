import { db } from "../src/lib/db/index.js";
import { scenes, characters, settings } from "../src/lib/db/schema.js";
import { eq, and } from "drizzle-orm";

const storyId = 'uHsfe456SMlHj1QW7GqBl';

console.log('🔍 Updating scene character and setting references for story:', storyId);

// Get all characters for the story
const storyCharacters = await db.select().from(characters).where(eq(characters.storyId, storyId));
console.log('\n👥 Characters found:', storyCharacters.length);
storyCharacters.forEach(ch => {
  console.log(`  ${ch.name} (${ch.id})`);
});

// Get all settings for the story
const storySettings = await db.select().from(settings).where(eq(settings.storyId, storyId));
console.log('\n📍 Settings found:', storySettings.length);
storySettings.forEach(st => {
  console.log(`  ${st.name} (${st.id})`);
});

// Get all scenes and update them
const storyScenes = await db.select().from(scenes);
console.log('\n🎬 Total scenes found:', storyScenes.length);

// For each scene, assign appropriate characters and settings
for (const scene of storyScenes) {
  console.log(`\n📝 Updating scene: ${scene.title}`);

  // Assign the first character as POV and add 1-2 more characters
  const povCharacterId = storyCharacters[0]?.id || null;
  const characterIds = storyCharacters.slice(1, 3).map(c => c.id); // Take 2 more characters

  // Assign the first setting to the scene
  const settingId = storySettings[0]?.id || null;
  const placeIds = storySettings.slice(1, 2).map(s => s.id); // Take 1 more setting

  console.log(`  POV Character: ${povCharacterId}`);
  console.log(`  Setting: ${settingId}`);
  console.log(`  Additional Characters: ${characterIds.join(', ')}`);
  console.log(`  Additional Places: ${placeIds.join(', ')}`);

  // Update the scene
  await db.update(scenes)
    .set({
      povCharacterId,
      settingId,
      characterIds,
      placeIds,
      updatedAt: new Date()
    })
    .where(eq(scenes.id, scene.id));

  console.log(`  ✅ Updated!`);
}

process.exit(0);