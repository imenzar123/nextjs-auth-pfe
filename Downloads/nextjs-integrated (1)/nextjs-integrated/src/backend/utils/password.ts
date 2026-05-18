import bcrypt from 'bcryptjs';

/** Cost factor used when hashing passwords in production flows. */
const SALT_ROUNDS = 12;

/**
 * Hash a plain-text password.
 * Use this when creating or updating user passwords.
 */
export async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, SALT_ROUNDS);
}

/**
 * Compare a plain-text password against a stored hash.
 * Returns true only when they match.
 */
export async function comparePassword(
  plain: string,
  hash: string,
): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}
