import { db } from '@/lib/db';
import { users } from '@/lib/db/schema';
import { nanoid } from 'nanoid';

export async function createOAuthUser({
  username,
  email,
  name,
  role = 'reader',
  image,
}: {
  username: string;
  email: string;
  name?: string;
  role?: 'manager' | 'writer' | 'reader';
  image?: string;
}) {
  const newUser = await db.insert(users).values({
    id: nanoid(),
    username,
    email,
    password: null, // OAuth users don't have passwords
    name,
    image,
    role,
    createdAt: new Date(),
    updatedAt: new Date(),
  }).returning();

  return newUser[0];
}