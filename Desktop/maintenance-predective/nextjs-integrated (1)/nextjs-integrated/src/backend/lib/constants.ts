/** Name of the HttpOnly cookie that holds the local JWT (used by middleware). */
export const AUTH_COOKIE_NAME = 'auth-token';

/** Name of the HttpOnly cookie that holds the Laravel Sanctum token (used by API proxy routes). */
export const LARAVEL_TOKEN_COOKIE = 'laravel-token';

/** Cookie lifetime in seconds (8 hours). */
export const AUTH_COOKIE_MAX_AGE = 8 * 60 * 60;

/**
 * Routes accessible only to users with the 'admin' role.
 * Used by both middleware.ts (server) and Sidebar (client) so it lives
 * here in constants — no Node.js or server-only APIs, safe anywhere.
 */
export const ADMIN_ONLY_PATHS = [
  '/gestion-utilisateurs',
  '/gestion-modules',
  '/journal-connexions',
] as const;
