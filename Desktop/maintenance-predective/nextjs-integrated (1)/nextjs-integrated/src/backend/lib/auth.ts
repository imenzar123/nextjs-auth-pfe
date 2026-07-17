/**
 * JWT helpers — edge-runtime safe (jose only, no Node.js crypto APIs).
 *
 * Used by:
 *   - src/app/api/auth/login/route.ts  (sign tokens)
 *   - src/middleware.ts                (verify tokens)
 */
import { SignJWT, jwtVerify } from 'jose';
import type { JWTPayload as AppJWTPayload, Role } from '@/types/auth';
import { AUTH_COOKIE_MAX_AGE } from './constants';

type TokenClaims = Pick<AppJWTPayload, 'id' | 'email' | 'role'>;

function getSecret(): Uint8Array {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error(
      'JWT_SECRET is not defined. Add it to your .env.local file.',
    );
  }
  return new TextEncoder().encode(secret);
}

/**
 * Sign a new JWT containing the given user claims.
 * Expiry is automatically set to AUTH_COOKIE_MAX_AGE seconds from now.
 */
export async function signToken(claims: TokenClaims): Promise<string> {
  return new SignJWT({ ...claims })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(`${AUTH_COOKIE_MAX_AGE}s`)
    .sign(getSecret());
}

/**
 * Verify and decode a JWT.
 * Throws if the token is invalid, malformed, or expired.
 */
export async function verifyToken(token: string): Promise<AppJWTPayload> {
  const { payload } = await jwtVerify(token, getSecret());

  return {
    id: payload['id'] as string,
    email: payload['email'] as string,
    role: payload['role'] as Role,
    iat: payload.iat as number,
    exp: payload.exp as number,
  };
}
