'use client';

import { useState } from 'react';
import Header from './Header';
import Sidebar from './Sidebar';
import { ThemeProvider } from '@/hooks/useTheme';
import { AuthProvider } from '@/frontend/context/AuthContext';

interface AppShellProps {
  children: React.ReactNode;
}

export default function AppShell({ children }: AppShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <AuthProvider>
      <ThemeProvider>
        <div className="wrapper">
          <Header onMenuToggle={() => setSidebarOpen(!sidebarOpen)} />
          <div className="page-wrap">
            <Sidebar
              isOpen={sidebarOpen}
              onClose={() => setSidebarOpen(false)}
            />
            <div className="main-content">
              {children}
            </div>
          </div>
        </div>
      </ThemeProvider>
    </AuthProvider>
  );
}
