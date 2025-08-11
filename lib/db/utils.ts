
import * as bcrypt from 'bcryptjs';

// Password utilities removed as we now use Google OAuth authentication
// Guest users are created through NextAuth providers

export function generateHashedPassword(password: string): string {
  const saltRounds = 10;
  return bcrypt.hashSync(password, saltRounds);
}

export function verifyPassword(password: string, hash: string): boolean {
  return bcrypt.compareSync(password, hash);
}
