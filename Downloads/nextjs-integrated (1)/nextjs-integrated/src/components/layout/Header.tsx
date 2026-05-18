'use client';

import { useTheme } from '@/hooks/useTheme';
import { useAuth } from '@/frontend/hooks/useAuth';

interface HeaderProps {
  onMenuToggle: () => void;
}

export default function Header({ onMenuToggle }: HeaderProps) {
  const { theme, toggleTheme } = useTheme();
  const { user, isLoading, logout } = useAuth();

  return (
    <header className="header-top" data-header-theme="light">
      <div className="container-fluid">
        <div className="d-flex justify-content-between">

          {/* ── Left side ──────────────────────────────────── */}
          <div className="top-menu d-flex align-items-center">
            <button
              type="button"
              className="btn-icon mobile-nav-toggle d-lg-none"
              onClick={onMenuToggle}
              aria-label="Toggle menu"
            >
              <span />
            </button>

            <button
              type="button"
              id="theme-toggle"
              className="nav-link"
              onClick={toggleTheme}
              aria-label="Toggle theme"
              title={theme === 'dark' ? 'Mode clair' : 'Mode sombre'}
            >
              <i
                className={`fas ${theme === 'dark' ? 'fa-moon' : 'fa-sun'}`}
                id="theme-icon"
              />
            </button>
          </div>

          {/* ── Right side: user info + logout ─────────────── */}
          <div className="top-menu d-flex align-items-center">
            {!isLoading && user && (
              <>
                <div className="header-user">
                  <div className="header-avatar" aria-hidden="true">
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="header-user-info">
                    <span className="header-user-name">{user.name}</span>
                    <span
                      className={`header-user-badge ${
                        user.role === 'admin'
                          ? 'header-badge-admin'
                          : 'header-badge-user'
                      }`}
                    >
                      {user.role === 'admin' ? 'Administrateur' : 'Utilisateur'}
                    </span>
                  </div>
                </div>

                <div className="header-sep" aria-hidden="true" />

                <button
                  type="button"
                  className="btn-icon"
                  onClick={logout}
                  title="Se déconnecter"
                  aria-label="Se déconnecter"
                >
                  <i className="fas fa-sign-out-alt" />
                </button>
              </>
            )}
          </div>

        </div>
      </div>
    </header>
  );
}
