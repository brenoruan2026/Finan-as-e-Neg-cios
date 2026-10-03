import React, { useState, useEffect } from 'react';
import { Sidebar } from './Sidebar.tsx';
import { TopHeader } from './TopHeader.tsx';
import { WifiOff } from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
  currentPath: string;
  onNavigate: (path: string) => void;
}

export const Layout: React.FC<LayoutProps> = ({ children, currentPath, onNavigate }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#071322] text-slate-900 dark:text-slate-100 flex flex-col transition-colors">
      {/* Offline banner */}
      {!isOnline && (
        <div className="bg-amber-600 text-white px-4 py-2 text-xs font-semibold flex items-center justify-center gap-2 sticky top-0 z-50 shadow-md">
          <WifiOff className="w-4 h-4 shrink-0" />
          <span>Sem conexão com a internet. Verifique sua conexão para continuar operando.</span>
        </div>
      )}

      {/* Main app layout */}
      <div className="flex flex-1">
        <Sidebar
          currentPath={currentPath}
          onNavigate={onNavigate}
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
        />

        <div className="flex-1 flex flex-col min-w-0 lg:pl-68">
          <TopHeader
            onToggleSidebar={() => setSidebarOpen((prev) => !prev)}
            onNavigate={onNavigate}
          />

          <main className="flex-1 p-4 lg:p-8 max-w-7xl w-full mx-auto animate-fadeIn">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
};
