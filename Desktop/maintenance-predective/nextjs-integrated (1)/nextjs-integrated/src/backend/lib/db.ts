/**
 * Mock user store — development only.
 *
 * In production replace this module with real database queries
 * (e.g. Prisma, Drizzle, or a raw SQL query).
 *
 * Passwords are hashed with bcrypt at module load time using 10 rounds
 * (fast enough for dev seeding; production passwords should use 12+).
 */
import bcrypt from 'bcryptjs';
import type { Role } from '@/types/auth';

export interface DbUser {
  id: string;
  email: string;
  passwordHash: string;
  name: string;
  role: Role;
}

// ─── Seed data ───────────────────────────────────────────────
// Plain-text passwords are only present here for seeding.
// They are hashed immediately below and never exported.
const SEED_USERS: Array<{
  id: string;
  email: string;
  password: string;
  name: string;
  role: Role;
}> = [
  {
    id: '1',
    email: 'admin@example.com',
    password: 'Admin@1234',
    name: 'Administrateur',
    role: 'admin',
  },
  {
    id: '2',
    email: 'user@example.com',
    password: 'User@1234',
    name: 'Utilisateur',
    role: 'user',
  },
];

// Hash once at startup — plain-text passwords are discarded after this.
export const users: DbUser[] = SEED_USERS.map((u) => ({
  id: u.id,
  email: u.email,
  passwordHash: bcrypt.hashSync(u.password, 10),
  name: u.name,
  role: u.role,
}));

// ─── Queries ─────────────────────────────────────────────────

export function findUserByEmail(email: string): DbUser | undefined {
  return users.find(
    (u) => u.email.toLowerCase() === email.toLowerCase(),
  );
}

export function findUserById(id: string): DbUser | undefined {
  return users.find((u) => u.id === id);
}
