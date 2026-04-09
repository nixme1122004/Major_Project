
import React from 'react';

interface SidebarProps {
  activePage: string;
  onPageChange: (page: any) => void;
  onLogout: () => void;
  isAdmin: boolean;
}

const Sidebar: React.FC<SidebarProps> = ({ activePage, onPageChange, onLogout, isAdmin }) => {
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: 'dashboard' },
    { id: 'marketplace', label: 'Marketplace', icon: 'store' },
    { id: 'matchmaker', label: 'Matchmaker', icon: 'auto_awesome' },
    { id: 'messages', label: 'Messages', icon: 'forum' },
    { id: 'profile', label: 'Profile', icon: 'person' },
  ];

  if (isAdmin) {
    navItems.push({ id: 'admin', label: 'Admin', icon: 'settings' });
  }

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="w-72 h-full bg-white dark:bg-slate-900 border-r border-slate-200/60 dark:border-slate-800/60 flex flex-col hidden md:flex z-40 transition-colors">
        <div className="p-8">
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            <span className="bg-indigo-600 w-8 h-8 rounded-lg flex items-center justify-center text-white text-sm">S</span>
            SkillSwap
          </h1>
        </div>
        
        <nav className="flex-1 px-4 space-y-1.5 overflow-y-auto">
          <p className="px-4 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2">Main Menu</p>
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => onPageChange(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group ${
                activePage === item.id 
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100 dark:shadow-indigo-900/20 font-semibold' 
                  : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <span className={`material-symbols-rounded transition-transform group-hover:rotate-12 group-hover:scale-110 ${activePage === item.id ? 'opacity-100' : 'opacity-70'}`}>
                {item.icon}
              </span>
              <span className="text-sm">{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="p-6 border-t border-slate-100 dark:border-slate-800">
          <div className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-4 mb-4">
            <p className="text-xs font-bold text-slate-800 dark:text-slate-200 mb-1">Upgrade to Pro</p>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 mb-3">Unlimited AI matches and priority scheduling.</p>
            <button className="w-full py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-700 hover:border-indigo-200 dark:hover:border-indigo-900 transition-all">Learn More</button>
          </div>
          <button 
            onClick={onLogout}
            className="w-full flex items-center gap-3 px-4 py-3 text-slate-400 dark:text-slate-500 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-xl transition-all group"
          >
            <span className="material-symbols-rounded opacity-70 group-hover:opacity-100 group-hover:rotate-12 transition-all">logout</span>
            <span className="text-sm font-medium">Logout</span>
          </button>
        </div>
      </aside>

      {/* Mobile Bottom Navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex items-center justify-around px-2 py-3 z-50 glass">
        {navItems.slice(0, 5).map((item) => (
          <button
            key={item.id}
            onClick={() => onPageChange(item.id)}
            className={`flex flex-col items-center gap-1 flex-1 transition-all ${
              activePage === item.id ? 'text-indigo-600 dark:text-indigo-400 scale-110' : 'text-slate-400 dark:text-slate-500'
            }`}
          >
            <span className="material-symbols-rounded">{item.icon}</span>
            <span className="text-[10px] font-bold uppercase tracking-tighter">{item.label}</span>
          </button>
        ))}
      </nav>
    </>
  );
};

export default Sidebar;
