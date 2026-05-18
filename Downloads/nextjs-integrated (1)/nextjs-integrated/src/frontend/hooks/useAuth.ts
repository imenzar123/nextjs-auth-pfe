/**
 * Re-export useAuth so components can import from the hooks folder
 * without knowing the internal context file path.
 *
 * Usage:
 *   import { useAuth } from '@/frontend/hooks/useAuth';
 */
export { useAuth } from '@/frontend/context/AuthContext';
