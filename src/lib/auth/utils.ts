import bcrypt from 'bcryptjs';
import { db } from '@/lib/db';
import { users } from '@/lib/db/schema';
import { nanoid } from 'nanoid';

export async function hashPassword(password: string): Promise<string> {
  const saltRounds = 12;
  return bcrypt.hash(password, saltRounds);
}

export async function createUser({
  username,
  email,
  password,
  name,
}: {
  username: string;
  email: string;
  password: string;
  name?: string;
}) {
  const hashedPassword = await hashPassword(password);
  
  const newUser = await db.insert(users).values({
    id: nanoid(),
    username,
    email,
    password: hashedPassword,
    name,
    createdAt: new Date(),
    updatedAt: new Date(),
  }).returning();

  return newUser[0];
}

export { bcrypt };