import React, { useState } from 'react';
import axios from 'axios';
import { User } from '../types';
import { BACKEND_URL } from '../config';

interface AuthPageProps {
  onAuthSuccess: (user: User, token: string) => void;
}


const AuthPage: React.FC<AuthPageProps> = ({ onAuthSuccess }) => {
  const [email, setEmail] = useState('sarah@college.ac.in');
  const [password, setPassword] = useState('password');
  const [name, setName] = useState('');
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [loading, setLoading] = useState(false);
  const [socialLoading, setSocialLoading] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (mode === 'login') {
        const { data } = await axios.post(`${BACKEND_URL}/api/auth/login`, { email, password });
        
        const loggedUser: User = {
          ...data.student,
          id: data.student.student_id, // Map database field to frontend field
          skillsOffered: data.student.skillsOffered || [], 
          skillsWanted: data.student.skillsWanted || [],
          points: 100,
          badges: ['Pioneer'],
          rating: 5.0,
          reviewCount: 0,
          isVerified: true,
          role: 'user',
          availability: [],
          joinedDate: data.student.created_at || new Date().toISOString()
        };

        onAuthSuccess(loggedUser, data.token);

      } else {
        if (!name.trim()) return alert('Please enter your full name.');
        
        await axios.post(`${BACKEND_URL}/api/auth/register`, {
          name,
          email,
          password,
          college_id: null // Ignored safely by backend constraint patch
        });

        // Automatically log them in after registration
        const { data } = await axios.post(`${BACKEND_URL}/api/auth/login`, { email, password });

        const newUser: User = {
          id: String(data.student_id || Math.random()),
          name: name,
          email: email,
          bio: 'New user on the block',
          avatar: `https://api.dicebear.com/7.x/notionists/svg?seed=${email}`,
          skillsOffered: [],
          skillsWanted: [],
          points: 0,
          badges: [],
          rating: 0,
          reviewCount: 0,
          isVerified: false,
          role: 'user',
          availability: [],
          joinedDate: new Date().toISOString()
        };

        onAuthSuccess(newUser, data.token);
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Authentication failed. Make sure your server is running!');
    } finally {
      setLoading(false);
    }
  };

  const handleSocialAuth = async (provider: 'Google' | 'LinkedIn') => {
    setSocialLoading(provider);
    await new Promise(resolve => setTimeout(resolve, 1200));
    setSocialLoading(null);
    alert('SSO is mocked out for local testing. Please use the manual login!');
  };

  return (
    <div className="min-h-screen flex bg-white dark:bg-slate-950 transition-colors">
      {/* Visual Side */}
      <div className="hidden lg:flex lg:w-1/2 bg-slate-900 relative items-center justify-center p-20 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-600/40 to-emerald-600/40 opacity-50"></div>
        <div className="absolute inset-0 opacity-20 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:40px_40px]"></div>
        
        <div className="relative z-10 max-w-md space-y-8">
          <div className="bg-white/10 backdrop-blur-xl border border-white/20 p-10 rounded-[3rem]">
            <h2 className="text-5xl font-black text-white leading-tight mb-6">Live Database Active.</h2>
            <p className="text-indigo-100/70 text-lg font-medium">You are now authenticating against a live MySQL backend connection.</p>
            
            <div className="flex items-center gap-4 mt-12 pt-12 border-t border-white/10">
              <div className="flex -space-x-4">
                {[1,2,3,4].map(i => (
                  <img 
                    key={i} 
                    src={`https://picsum.photos/seed/liveuser${i}/100`} 
                    className="w-12 h-12 rounded-full border-4 border-slate-900 object-cover" 
                    alt="User"
                  />
                ))}
              </div>
              <p className="text-sm font-bold text-white/80 uppercase tracking-widest">SECURE WEBRTC ENABLED</p>
            </div>
          </div>
        </div>
      </div>

      {/* Auth Side */}
      <div className="flex-1 flex items-center justify-center p-8 md:p-20">
        <div className="w-full max-w-md space-y-10">
          <div className="space-y-4 text-center lg:text-left">
            <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tight">
              {mode === 'login' ? 'Welcome back' : 'Start sharing'}
            </h1>
            <p className="text-slate-400 dark:text-slate-500 font-medium">
              {mode === 'login' ? 'Please enter your details to access the neural network.' : 'Create your credentials to join the global swap economy.'}
            </p>
          </div>

          <div className="flex p-1 bg-slate-100 dark:bg-slate-900 rounded-2xl">
            <button onClick={() => setMode('login')} className={`flex-1 py-3 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all ${mode === 'login' ? 'bg-white dark:bg-slate-800 shadow-sm text-indigo-600 dark:text-indigo-400' : 'text-slate-500 dark:text-slate-500'}`}>Member Login</button>
            <button onClick={() => setMode('signup')} className={`flex-1 py-3 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all ${mode === 'signup' ? 'bg-white dark:bg-slate-800 shadow-sm text-indigo-600 dark:text-indigo-400' : 'text-slate-500 dark:text-slate-500'}`}>New Account</button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {mode === 'signup' && (
              <div className="space-y-2 animate-in fade-in slide-in-from-top-2 duration-300">
                <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest px-1">Full Name</label>
                <input 
                  type="text" 
                  required 
                  placeholder="John Doe"
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl px-6 py-4 outline-none focus:ring-4 focus:ring-indigo-600/10 focus:border-indigo-600 transition-all font-bold text-slate-900 dark:text-white" 
                  value={name} 
                  onChange={e => setName(e.target.value)} 
                />
              </div>
            )}
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest px-1">Email</label>
              <input 
                type="email" 
                required 
                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl px-6 py-4 outline-none focus:ring-4 focus:ring-indigo-600/10 focus:border-indigo-600 transition-all font-bold text-slate-900 dark:text-white" 
                value={email} 
                onChange={e => setEmail(e.target.value)} 
              />
            </div>
            <div className="space-y-2">
              <div className="flex justify-between items-center px-1">
                <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Secure Password</label>
                {mode === 'login' && <button type="button" className="text-[10px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-widest hover:underline">Forgot?</button>}
              </div>
              <input 
                type="password" 
                required 
                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl px-6 py-4 outline-none focus:ring-4 focus:ring-indigo-600/10 focus:border-indigo-600 transition-all font-bold text-slate-900 dark:text-white" 
                value={password} 
                onChange={e => setPassword(e.target.value)} 
              />
            </div>

            <button 
              disabled={loading || !!socialLoading}
              className="w-full bg-slate-900 dark:bg-indigo-600 text-white py-5 rounded-[1.5rem] font-black text-xs uppercase tracking-widest hover:bg-indigo-600 dark:hover:bg-indigo-700 shadow-2xl shadow-slate-200 dark:shadow-none hover:shadow-indigo-100 transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading && <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>}
              {mode === 'login' ? (loading ? 'Authenticating...' : 'Authenticate') : (loading ? 'Creating Account...' : 'Join SkillSwap')}
            </button>
          </form>

          <div className="flex items-center gap-4 py-4">
            <div className="flex-1 h-px bg-slate-100 dark:bg-slate-800"></div>
            <span className="text-[10px] font-black text-slate-300 dark:text-slate-600 uppercase tracking-widest">SSO Secure</span>
            <div className="flex-1 h-px bg-slate-100 dark:bg-slate-800"></div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <button 
              onClick={() => handleSocialAuth('Google')}
              disabled={loading || !!socialLoading}
              className="flex items-center justify-center gap-3 border border-slate-200 dark:border-slate-800 rounded-2xl py-4 font-black text-[10px] uppercase tracking-widest hover:bg-slate-50 dark:hover:bg-slate-900 transition-all text-slate-900 dark:text-white disabled:opacity-50"
            >
              {socialLoading === 'Google' ? <span className="w-3 h-3 border-2 border-indigo-600/30 border-t-indigo-600 rounded-full animate-spin"></span> : 'Google'}
            </button>
            <button 
              onClick={() => handleSocialAuth('LinkedIn')}
              disabled={loading || !!socialLoading}
              className="flex items-center justify-center gap-3 border border-slate-200 dark:border-slate-800 rounded-2xl py-4 font-black text-[10px] uppercase tracking-widest hover:bg-slate-50 dark:hover:bg-slate-900 transition-all text-slate-900 dark:text-white disabled:opacity-50"
            >
              {socialLoading === 'LinkedIn' ? <span className="w-3 h-3 border-2 border-indigo-600/30 border-t-indigo-600 rounded-full animate-spin"></span> : 'LinkedIn'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthPage;
