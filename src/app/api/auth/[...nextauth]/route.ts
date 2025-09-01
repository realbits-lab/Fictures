import { handlers } from '@/lib/auth';

export const { GET, POST } = handlers;

// Force Node.js runtime to avoid Edge Runtime issues with database
export const runtime = 'nodejs';