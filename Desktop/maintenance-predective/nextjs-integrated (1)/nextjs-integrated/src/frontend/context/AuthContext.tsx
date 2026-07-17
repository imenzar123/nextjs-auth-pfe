'use client';

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from 'react';
import { useRouter } from 'next/navigation';
import type { AuthUser } from '@/types/auth';

// ─── Context shape ────────────────────────────────────────────
interface AuthContextValue {
  /** Authenticated user, or null when unauthenticated / still loading. */
  user: AuthUser | null;
  /** True while the initial /api/auth/me fetch is in flight. */
  isLoading: boolean;
  /** Call to clear the session cookie and navigate to /login. */
  logout: () => Promise<void>;
  /** Re-fetch the current user from the server and update state. */
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

// ─── Provider ─────────────────────────────────────────────────
export function AuthProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchMe = useCallback(async (): Promise<AuthUser | null> => {
    try {
      const res = await fetch('/api/auth/me');
      return res.ok ? (res.json() as Promise<AuthUser>) : null;
    } catch {
      return null;
    }
  }, []);

  // Fetch the current user from the JWT cookie once on mount.
  useEffect(() => {
    fetchMe()
      .then((data) => setUser(data))
      .finally(() => setIsLoading(false));
  }, [fetchMe]);

  const refreshUser = useCallback(async () => {
    const data = await fetchMe();
    setUser(data);
  }, [fetchMe]);

  const logout = useCallback(async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } finally {
      setUser(null);
      router.push('/login');
    }
  }, [router]);

  return (
    <AuthContext.Provider value={{ user, isLoading, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

// ─── Hook ─────────────────────────────────────────────────────
export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be called inside <AuthProvider>.');
  }
  return ctx;
}
