
import React from 'react';
import { User } from '../types';

interface HeaderProps {
  user: User;
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
  onNavigate: (page: any) => void;
}

const Header: React.FC<HeaderProps> = ({ user, theme, onToggleTheme, onNavigate }) => {
  return (
    <header className="h-20 bg-white/80 dark:bg-slate-900/80 border-b border-slate-200/60 dark:border-slate-800/60 flex items-center justify-between px-6 md:px-10 sticky top-0 z-30 glass transition-colors">
      <div className="flex flex-col">
        <h2 className="text-lg font-extrabold text-slate-900 dark:text-white tracking-tight">
          Hello, {user.name.split(' ')[0]} 👋
        </h2>
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
          <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Student & Mentor</span>
        </div>
      </div>
      
      <div className="flex items-center gap-3 md:gap-6">
        <button 
          onClick={onToggleTheme}
          className="w-10 h-10 flex items-center justify-center rounded-xl bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 transition-all text-xl"
          title={`Switch to ${theme === 'light' ? 'Dark' : 'Light'} Mode`}
        >
          <span className="material-symbols-rounded">{theme === 'light' ? 'dark_mode' : 'light_mode'}</span>
        </button>

        <div className="flex items-center gap-2 bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/50 px-4 py-1.5 rounded-full hidden sm:flex">
          <span className="text-indigo-600 dark:text-indigo-400 font-black text-sm">{user.points}</span>
          <span className="text-[10px] text-indigo-400 dark:text-indigo-500 font-bold uppercase tracking-widest">Points</span>
        </div>
        
        <div className="flex items-center gap-5">
          <button className="relative w-10 h-10 flex items-center justify-center rounded-xl bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">
            <span className="material-symbols-rounded text-slate-400">notifications</span>
            <span className="absolute top-2 right-2 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white dark:border-slate-900"></span>
          </button>
          
          <div className="flex items-center gap-3 pl-5 border-l border-slate-200/60 dark:border-slate-800">
            <div className="text-right hidden sm:block">
              <p className="text-xs font-bold text-slate-900 dark:text-white leading-none mb-0.5">{user.name}</p>
              <p className="text-[10px] font-medium text-slate-400 dark:text-slate-500 uppercase tracking-tighter">Level {Math.floor(user.points / 100) + 1}</p>
            </div>
            <div 
              className="relative cursor-pointer group" 
              onClick={() => onNavigate('profile')}
              title="View Profile"
            >
              <img 
                src={user.avatar} 
                alt={user.name} 
                className="w-10 h-10 rounded-xl object-cover ring-2 ring-white dark:ring-slate-800 shadow-md group-hover:ring-indigo-500 transition-all"
              />
              <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 rounded-full border-2 border-white dark:border-slate-900"></div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
