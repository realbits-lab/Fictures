import { Session } from 'next-auth';

export type UserRole = 'admin' | 'writer' | 'reader' | 'moderator';

export function hasRole(session: Session | null, role: UserRole): boolean {
  return session?.user?.role === role;
}

export function hasAnyRole(session: Session | null, roles: UserRole[]): boolean {
  return roles.includes(session?.user?.role as UserRole);
}

export function isAdmin(session: Session | null): boolean {
  return hasRole(session, 'admin');
}

export function isWriter(session: Session | null): boolean {
  return hasRole(session, 'writer');
}

export function isReader(session: Session | null): boolean {
  return hasRole(session, 'reader');
}

export function canWrite(session: Session | null): boolean {
  return hasAnyRole(session, ['admin', 'writer']);
}

export function canModerate(session: Session | null): boolean {
  return hasAnyRole(session, ['admin', 'moderator']);
}

export function getUserRole(session: Session | null): UserRole | null {
  return (session?.user?.role as UserRole) || null;
}