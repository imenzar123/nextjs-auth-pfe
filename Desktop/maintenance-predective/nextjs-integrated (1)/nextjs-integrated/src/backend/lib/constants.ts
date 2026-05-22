/** Name of the HttpOnly cookie that holds the local JWT (used by middleware). */
export const AUTH_COOKIE_NAME = 'auth-token';

/** Name of the HttpOnly cookie that holds the Laravel Sanctum token (used by API proxy routes). */
export const LARAVEL_TOKEN_COOKIE = 'laravel-token';

/** Cookie lifetime in seconds (8 hours). */
export const AUTH_COOKIE_MAX_AGE = 8 * 60 * 60;

/**
 * Routes accessible only to the 'admin' role.
 * Used by middleware.ts and Sidebar.
 */
export const ADMIN_ONLY_PATHS = [
  '/gestion-utilisateurs',
] as const;

/**
 * Routes accessible to 'admin' and 'operator' roles (not plain 'user').
 * Used by middleware.ts and Sidebar.
 */
export const ELEVATED_PATHS = [
  '/gestion-modules',
  '/journal-connexions',
  '/configurer-capteurs',
] as const;
