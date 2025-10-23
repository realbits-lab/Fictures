import { drizzle } from 'drizzle-orm/neon-http';
import { neon } from '@neondatabase/serverless';
import { comments } from '../src/lib/db/schema.js';
import { eq } from 'drizzle-orm';

const sql = neon(process.env.POSTGRES_URL);
const db = drizzle(sql);

const sceneId = 'q5ADGYGvX8Eid7JnI5-26';

console.log(`\n🔍 Checking comments for scene: ${sceneId}\n`);

const allComments = await db
  .select({
    id: comments.id,
    content: comments.content,
    parentCommentId: comments.parentCommentId,
    sceneId: comments.sceneId,
    isDeleted: comments.isDeleted,
    depth: comments.depth,
    createdAt: comments.createdAt,
  })
  .from(comments)
  .where(eq(comments.sceneId, sceneId));

console.log(`Found ${allComments.length} total comments\n`);

if (allComments.length > 0) {
  console.log('Comments:');
  allComments.forEach((comment, index) => {
    console.log(`\n${index + 1}. Comment ID: ${comment.id}`);
    console.log(`   Content: ${comment.content.substring(0, 50)}...`);
    console.log(`   Parent: ${comment.parentCommentId || 'None (top-level)'}`);
    console.log(`   Deleted: ${comment.isDeleted}`);
    console.log(`   Depth: ${comment.depth}`);
    console.log(`   Created: ${comment.createdAt}`);
  });

  const deletedCount = allComments.filter(c => c.isDeleted).length;
  const activeCount = allComments.filter(c => !c.isDeleted).length;

  console.log(`\n📊 Summary:`);
  console.log(`   Total: ${allComments.length}`);
  console.log(`   Active: ${activeCount}`);
  console.log(`   Deleted: ${deletedCount}`);
} else {
  console.log('No comments found for this scene.');
}

process.exit(0);
