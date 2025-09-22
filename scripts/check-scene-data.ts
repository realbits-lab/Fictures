import { db } from "../src/lib/db";
import { scenes } from "../src/lib/db/schema";

async function checkScenes() {
  console.log('🔍 Checking scene data...\n');

  // Get all scenes
  const sceneList = await db.select().from(scenes).limit(3);

  for (const scene of sceneList) {
    console.log(`Scene: ${scene.title} (${scene.id})`);
    console.log('  POV Character ID:', scene.povCharacterId);
    console.log('  Setting ID:', scene.settingId);
    console.log('  Character IDs:', scene.characterIds);
    console.log('  Place IDs:', scene.placeIds);
    console.log('---');
  }

  process.exit(0);
}

checkScenes();