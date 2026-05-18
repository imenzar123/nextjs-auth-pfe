/**
 * Authentication business logic.
 *
 * This service is the single entry point for login verification.
 * It is intentionally decoupled from HTTP — it knows nothing about
 * cookies, headers, or request/response objects.
 */
import { findUserByEmail } from '@/backend/lib/db';
import { comparePassword } from '@/backend/utils/password';
import type { AuthUser } from '@/types/auth';

/**
 * Validate email + password credentials.
 *
 * @returns The authenticated user (without passwordHash) on success,
 *          or `null` if the email does not exist or the password is wrong.
 *
 * Note: both "user not found" and "wrong password" return null
 * to prevent user-enumeration attacks.
 */
export async function loginUser(
  email: string,
  password: string,
): Promise<AuthUser | null> {
  const dbUser = findUserByEmail(email);

  // User not found — still run compare to prevent timing attacks.
  if (!dbUser) {
    await comparePassword(password, '$2b$12$invalidhashpadding000000000000000000000000000000000000000');
    return null;
  }

  const isValid = await comparePassword(password, dbUser.passwordHash);
  if (!isValid) return null;

  // Return a clean user object — never include passwordHash.
  return {
    id: dbUser.id,
    email: dbUser.email,
    name: dbUser.name,
    role: dbUser.role,
  };
}
