import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { BACKEND_URL } from './config';
import { User, AuthState } from './types';
import { StorageService } from './services/storage';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import CallOverlay from './components/CallOverlay';
import { socketService } from './services/socket';

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
  const [callData, setCallData] = useState<{ 
    receiverId: string | number; 
    receiverName: string; 
    receiverAvatar?: string;
    mode: 'voice' | 'video';
    isIncoming?: boolean;
    incomingOffer?: any;
  } | null>(null);

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
    if (auth.token) {
      const socket = socketService.connect(auth.token);
      
      socket.on('incoming-call', (data) => {
        console.log('🔔 Global Incoming call received:', data);
        setCallData({
          receiverId: data.from,
          receiverName: data.name,
          receiverAvatar: data.avatar,
          incomingOffer: data.offer,
          mode: data.mode,
          isIncoming: true
        });
        setIsCallActive(true);
      });

      socket.on('new-request', (data) => {
        console.log('📬 New Skill Swap Request:', data);
        alert(`New Request: ${data.from_name} wants to swap skills with you! Check your Dashboard.`);
      });

      socket.on('stop-ringing', (data) => {
        console.log('🔇 Stopping ring (handled elsewhere):', data);
        setIsCallActive(false);
        setCallData(null);
      });

      return () => {
        socket.off('incoming-call');
        socket.off('stop-ringing');
      };
    }
  }, [auth.token]);

  useEffect(() => {
    const handleOpenCall = (e: any) => {
      if (e.detail) {
        setCallData(e.detail);
      }
      setIsCallActive(true);
    };
    window.addEventListener('open-call', handleOpenCall);
    return () => window.removeEventListener('open-call', handleOpenCall);
  }, []);

  const handleLogout = () => {
    setAuth({ user: null, token: null });
    setCurrentPage('dashboard');
    setIsCallActive(false);
  };


  const refreshUser = async () => {
    if (auth.token) {
      try {
        const { data } = await axios.get(`${BACKEND_URL}/api/student/profile`, {
          headers: { Authorization: `Bearer ${auth.token}` }
        });
        const updatedUser: User = {
          ...data,
          id: data.student_id,
          skillsOffered: data.skillsOffered || [],
          skillsWanted: data.skillsWanted || [],
          points: data.points || 100,
          badges: auth.user?.badges || ['Pioneer'],
          rating: data.rating || 5.0,
          joinedDate: data.created_at || auth.user?.joinedDate
        };
        setAuth(prev => ({ ...prev, user: updatedUser }));
      } catch (err) {
        console.error('Refresh user failed:', err);
      }
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
      <CallOverlay 
        isOpen={isCallActive} 
        onClose={() => setIsCallActive(false)} 
        receiverId={callData?.receiverId}
        receiverName={callData?.receiverName}
        receiverAvatar={callData?.receiverAvatar}
        mode={callData?.mode || 'video'}
        isIncoming={callData?.isIncoming}
        incomingOffer={callData?.incomingOffer}
      />
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
