import { getRedisSubscriber, CHANNELS } from '@/lib/redis/client';
import { auth } from '@/lib/auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Track active connections for monitoring
let activeConnections = 0;

export async function GET(request: Request) {
  try {
    // Optional: Check authentication
    // Uncomment if you want to restrict SSE to authenticated users only
    // const session = await auth();
    // if (!session?.user?.id) {
    //   return new Response('Unauthorized', { status: 401 });
    // }

    // Create a ReadableStream for Server-Sent Events
    const encoder = new TextEncoder();

    const stream = new ReadableStream({
      async start(controller) {
        activeConnections++;
        console.log(`[SSE] Client connected. Active connections: ${activeConnections}`);

        // Create a dedicated subscriber for this connection
        const subscriber = getRedisSubscriber();

        // Helper function to send SSE events
        const sendEvent = (event: string, data: unknown) => {
          try {
            const message = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
            controller.enqueue(encoder.encode(message));
          } catch (error) {
            console.error('[SSE] Error sending event:', error);
          }
        };

        // Send initial connection confirmation
        sendEvent('connected', {
          timestamp: new Date().toISOString(),
          message: 'Connected to Fictures real-time events',
        });

        // Keep-alive ping every 30 seconds to prevent connection timeout
        const keepAliveInterval = setInterval(() => {
          sendEvent('ping', { timestamp: new Date().toISOString() });
        }, 30000);

        // Subscribe to all community-related Redis channels
        try {
          await subscriber.subscribe(
            CHANNELS.STORY_PUBLISHED,
            CHANNELS.STORY_UPDATED,
            CHANNELS.STORY_DELETED,
            CHANNELS.POST_CREATED,
            CHANNELS.POST_UPDATED,
            CHANNELS.POST_DELETED
          );

          console.log('[SSE] Subscribed to Redis channels:', [
            CHANNELS.STORY_PUBLISHED,
            CHANNELS.STORY_UPDATED,
            CHANNELS.STORY_DELETED,
            CHANNELS.POST_CREATED,
            CHANNELS.POST_UPDATED,
            CHANNELS.POST_DELETED,
          ]);
        } catch (error) {
          console.error('[SSE] Failed to subscribe to Redis channels:', error);
          sendEvent('error', {
            message: 'Failed to subscribe to real-time events',
            timestamp: new Date().toISOString(),
          });
        }

        // Handle incoming Redis messages
        subscriber.on('message', (channel, message) => {
          try {
            const data = JSON.parse(message);

            switch (channel) {
              case CHANNELS.STORY_PUBLISHED:
                sendEvent('story-published', data);
                console.log('[SSE] Broadcasting story-published event:', data.storyId);
                break;

              case CHANNELS.STORY_UPDATED:
                sendEvent('story-updated', data);
                console.log('[SSE] Broadcasting story-updated event:', data.storyId);
                break;

              case CHANNELS.STORY_DELETED:
                sendEvent('story-deleted', data);
                console.log('[SSE] Broadcasting story-deleted event:', data.storyId);
                break;

              case CHANNELS.POST_CREATED:
                sendEvent('post-created', data);
                console.log('[SSE] Broadcasting post-created event:', data.postId);
                break;

              case CHANNELS.POST_UPDATED:
                sendEvent('post-updated', data);
                console.log('[SSE] Broadcasting post-updated event:', data.postId);
                break;

              case CHANNELS.POST_DELETED:
                sendEvent('post-deleted', data);
                console.log('[SSE] Broadcasting post-deleted event:', data.postId);
                break;

              default:
                console.warn('[SSE] Unknown channel:', channel);
            }
          } catch (error) {
            console.error('[SSE] Error parsing Redis message:', error);
          }
        });

        // Handle Redis errors
        subscriber.on('error', (error) => {
          console.error('[SSE] Redis subscriber error:', error);
          sendEvent('error', {
            message: 'Real-time connection error',
            timestamp: new Date().toISOString(),
          });
        });

        // Clean up when client disconnects
        request.signal.addEventListener('abort', async () => {
          console.log('[SSE] Client disconnected');
          activeConnections--;
          console.log(`[SSE] Active connections: ${activeConnections}`);

          // Clear keep-alive interval
          clearInterval(keepAliveInterval);

          // Unsubscribe from all channels
          try {
            await subscriber.unsubscribe();
            console.log('[SSE] Unsubscribed from all channels');
          } catch (error) {
            console.error('[SSE] Error unsubscribing:', error);
          }

          // Close the subscriber connection
          try {
            await subscriber.quit();
            console.log('[SSE] Closed subscriber connection');
          } catch (error) {
            console.error('[SSE] Error closing subscriber:', error);
          }

          // Close the stream controller
          try {
            controller.close();
          } catch (error) {
            console.error('[SSE] Error closing controller:', error);
          }
        });
      },
    });

    // Return the stream with SSE headers
    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache, no-transform',
        'Connection': 'keep-alive',
        'X-Accel-Buffering': 'no', // Disable nginx buffering if deployed behind nginx
      },
    });
  } catch (error) {
    console.error('[SSE] Error creating SSE connection:', error);
    return new Response(
      JSON.stringify({
        error: 'Failed to establish real-time connection',
        details: error instanceof Error ? error.message : 'Unknown error',
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}
