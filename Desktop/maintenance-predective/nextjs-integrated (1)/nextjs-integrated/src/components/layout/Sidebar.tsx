'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { navItems } from '@/services/navigationData';
import { useAuth } from '@/frontend/hooks/useAuth';
import { ADMIN_ONLY_PATHS, ELEVATED_PATHS } from '@/backend/lib/constants';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
  const pathname = usePathname();
  const { user } = useAuth();

  const visibleNavItems = navItems.filter((item) => {
    if ((ADMIN_ONLY_PATHS as readonly string[]).includes(item.href)) {
      return user?.role === 'admin';
    }
    if ((ELEVATED_PATHS as readonly string[]).includes(item.href)) {
      return user?.role === 'admin' || user?.role === 'operator';
    }
    return true;
  });

  return (
    <>
      {/* Mobile overlay */}
      <div
        className={`sidebar-overlay${isOpen ? ' active' : ''}`}
        onClick={onClose}
        aria-hidden="true"
      />

      <div className={`app-sidebar colored${isOpen ? ' open' : ''}`}>
        {/* Sidebar Header */}
        <div className="sidebar-header">
          <Link className="header-brand" href="/" onClick={onClose}>
            <div className="logo-img">
              <img src="/images/brand-white.svg" className="header-brand-img" alt="Logo" />
            </div>
            <span className="text">ThemeKit</span>
          </Link>
          <button
            id="sidebarClose"
            className="nav-close"
            onClick={onClose}
            aria-label="Fermer le menu"
          >
            <i className="fas fa-times" />
          </button>
        </div>

        {/* Sidebar Content */}
        <div className="sidebar-content">
          <div className="nav-container">
            <nav id="main-menu-navigation" className="navigation-main">
              {(() => {
                const groups: Record<string, typeof navItems> = {};
                for (const item of visibleNavItems) {
                  const g = item.group || 'Navigation';
                  if (!groups[g]) groups[g] = [];
                  groups[g].push(item);
                }
                return Object.entries(groups).map(([groupName, items]) => (
                  <div key={groupName}>
                    <div className="nav-lavel">{groupName}</div>
                    {items.map((item) => {
                      const isActive = pathname === item.href;
                      return (
                        <div
                          key={item.href}
                          className={`nav-item${isActive ? ' active' : ''}`}
                        >
                          <Link href={item.href} onClick={onClose}>
                            <i className={item.icon} />
                            <span>{item.label}</span>
                          </Link>
                        </div>
                      );
                    })}
                  </div>
                ));
              })()}
            </nav>
          </div>
        </div>
      </div>
    </>
  );
}
