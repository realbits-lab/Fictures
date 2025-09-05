import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { scenes } from '../src/lib/db/schema';
import { inArray } from 'drizzle-orm';

// Use the same connection as the app
const client = postgres(process.env.POSTGRES_URL!, { prepare: false });
const db = drizzle(client);

const sceneIds = [
  '97sYa_NNQOkJNoamFtC4_',
  'etwcTbnObmOQWvBSwoXj8', 
  'QHMil2zAdkr9uB0zVd4V5',
  'JPD5bUQ5B40hHTQ59PuLR',
  'Lg1xmSM9iu-FAojIKFafN',
  'DMs4M-PlbTCoUBdDaayY7',
  '0uNt5aklYjDkS54V-E0z-',
  'DL8D2jf8L0_NZs1TIVTqt',
  'DV67SlxPTWnDx1gmsbfCi'
];

async function updateSceneStatus() {
  try {
    console.log('Connecting to database...');
    console.log('Database URL:', process.env.POSTGRES_URL);
    
    // First, check current status
    const currentScenes = await db
      .select()
      .from(scenes)
      .where(inArray(scenes.id, sceneIds));
      
    console.log('Current scene statuses:');
    currentScenes.forEach(scene => {
      console.log(`${scene.id}: ${scene.status}`);
    });
    
    // Update all scenes to completed status
    const result = await db
      .update(scenes)
      .set({ status: 'completed' })
      .where(inArray(scenes.id, sceneIds))
      .returning();
      
    console.log(`Updated ${result.length} scenes to completed status`);
    
    // Verify the update
    const updatedScenes = await db
      .select()
      .from(scenes)
      .where(inArray(scenes.id, sceneIds));
      
    console.log('Updated scene statuses:');
    updatedScenes.forEach(scene => {
      console.log(`${scene.id}: ${scene.status}`);
    });
    
  } catch (error) {
    console.error('Error updating scene status:', error);
  } finally {
    await client.end();
  }
}

updateSceneStatus();