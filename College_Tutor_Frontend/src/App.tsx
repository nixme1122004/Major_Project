import React, { useState, useEffect } from 'react';
import { User, AuthState } from './types';
import { StorageService } from './services/storage';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import CallOverlay from './components/CallOverlay';

// Pages
import Marketplace from './pages/Marketplace';
import Dashboard from './pages/Dashboard';
import Profile from './pages/Profile';
import Messages from './pages/Messages';
import Matchmaker from './pages/Matchmaker';
import AdminDashboard from './pages/AdminDashboard';
import AuthPage from './pages/AuthPage';

// We've moved VideoCall logic directly inside our secure CallOverlay component

const App: React.FC = () => {
  const [auth, setAuth] = useState<AuthState>(() => {
    const saved = localStorage.getItem('skillswap_auth');
    return saved ? JSON.parse(saved) : { user: null, token: null };
  });

  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    const saved = localStorage.getItem('skillswap_theme');
    if (saved === 'light' || saved === 'dark') return saved;
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  });

  const [currentPage, setCurrentPage] = useState<'dashboard' | 'marketplace' | 'matchmaker' | 'messages' | 'profile' | 'admin' | 'video'>('dashboard');
  const [isCallActive, setIsCallActive] = useState(false);

  useEffect(() => {
    localStorage.setItem('skillswap_auth', JSON.stringify(auth));
  }, [auth]);

  useEffect(() => {
    localStorage.setItem('skillswap_theme', theme);
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  useEffect(() => {
    const handleOpenCall = () => setIsCallActive(true);
    window.addEventListener('open-call', handleOpenCall);
    return () => window.removeEventListener('open-call', handleOpenCall);
  }, []);

  const handleLogout = () => {
    setAuth({ user: null, token: null });
    setCurrentPage('dashboard');
    setIsCallActive(false);
  };

  const refreshUser = () => {
    if (auth.user) {
      const updated = StorageService.getUserById(auth.user.id);
      if (updated) setAuth(prev => ({ ...prev, user: updated }));
    }
  };

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  if (!auth.user || !auth.token) {
    return <AuthPage onAuthSuccess={(user, token) => setAuth({ user, token })} />;
  }

  const renderContent = () => {
    switch (currentPage) {
      case 'dashboard': return <Dashboard user={auth.user} onNavigate={setCurrentPage} />;
      case 'marketplace': return <Marketplace user={auth.user} onRefresh={refreshUser} />;
      case 'matchmaker': return <Matchmaker user={auth.user} onRefresh={refreshUser} />;
      case 'messages': return <Messages user={auth.user} />;
      case 'profile': return <Profile user={auth.user} onUpdate={refreshUser} />;
      case 'admin': return auth.user.role === 'admin' ? <AdminDashboard /> : <div>Access Denied</div>;
      default: return <Dashboard user={auth.user} onNavigate={setCurrentPage} />;
    }
  };

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50 dark:bg-slate-950 transition-colors duration-300">
      <CallOverlay isOpen={isCallActive} onClose={() => setIsCallActive(false)} />
      <Sidebar 
        activePage={currentPage} 
        onPageChange={setCurrentPage} 
        onLogout={handleLogout} 
        isAdmin={auth.user.role === 'admin'}
      />
      <div className="flex flex-col flex-1 overflow-y-auto">
        <Header user={auth.user} theme={theme} onToggleTheme={toggleTheme} onNavigate={setCurrentPage} />
        <main className="p-6 md:p-10">
          {renderContent()}
        </main>
      </div>
    </div>
  );
};

export default App;
