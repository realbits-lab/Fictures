import type { NextRequest } from 'next/server';
import { authenticateRequest, hasRequiredScope } from '@/lib/auth/dual-auth';
import { db } from '@/lib/db';
import { sql } from 'drizzle-orm';

export async function POST(request: NextRequest) {
  try {
    // Check authentication and admin scope
    const authResult = await authenticateRequest(request);
    if (!authResult) {
      return new Response('Authentication required', { status: 401 });
    }

    // Require admin scope for database operations
    if (!hasRequiredScope(authResult, 'admin:all')) {
      return new Response('Insufficient permissions. Required scope: admin:all', { status: 403 });
    }

    const body = await request.json();
    const { query } = body;

    if (!query) {
      return new Response('Query is required', { status: 400 });
    }

    // Only allow DELETE FROM stories for safety
    if (!query.toLowerCase().includes('delete from stories')) {
      return new Response('Only DELETE FROM stories is allowed', { status: 400 });
    }

    console.log('🗑️ Executing database cleanup:', query);

    // Execute the query
    const result = await db.execute(sql.raw(query));

    console.log('✅ Database cleanup completed');

    return Response.json({
      success: true,
      message: 'Database cleanup completed'
    });

  } catch (error) {
    console.error('❌ Database operation error:', error);
    return Response.json(
      {
        success: false,
        error: 'Database operation failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}