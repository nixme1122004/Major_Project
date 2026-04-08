
import React, { useState, useMemo } from 'react';
import { User, Booking, Milestone } from '../types';
import { StorageService } from '../services/storage';
import { AIService } from '../services/aiService';

interface MarketplaceProps {
  user: User;
  onRefresh: () => void;
}

const Marketplace: React.FC<MarketplaceProps> = ({ user, onRefresh }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState<'offered' | 'wanted'>('offered');
  const [requestingId, setRequestingId] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState('All');
  
  const categories = ['All', 'Programming', 'Arts', 'Cooking', 'Music', 'Business', 'Languages'];
  const allUsers = useMemo(() => StorageService.getUsers(), []);
  
  const filteredSkills = useMemo(() => {
    const list: any[] = [];
    allUsers.forEach(u => {
      if (u.id === user.id) return;
      const skills = filter === 'offered' ? u.skillsOffered : u.skillsWanted;
      skills.forEach(s => {
        const matchesSearch = s.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                             u.name.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesCategory = activeCategory === 'All' || s.category === activeCategory;
        
        if (matchesSearch && matchesCategory) {
          list.push({ ...s, owner: u });
        }
      });
    });
    return list;
  }, [allUsers, searchTerm, filter, user.id, activeCategory]);

  const handleRequest = async (item: any) => {
    const uniqueId = `${item.owner.id}-${item.id}`;
    setRequestingId(uniqueId);
    
    try {
      // AI Integration: Generate milestones for the session automatically
      // This makes the 'Offer Guidance' or 'Request Session' feel intelligent and high-end
      const milestoneTitles = await AIService.generateLearningMilestones(item.name, item.proficiency);
      const milestones: Milestone[] = milestoneTitles.map(title => ({
        id: Math.random().toString(36).substr(2, 9),
        title,
        isCompleted: false
      }));

      const isTeacherOffering = filter === 'wanted';

      const newBooking: Booking = {
        id: Math.random().toString(36).substr(2, 9),
        teacherId: isTeacherOffering ? user.id : item.owner.id,
        learnerId: isTeacherOffering ? item.owner.id : user.id,
        skillId: item.id,
        skillName: item.name,
        startTime: new Date(Date.now() + 86400000).toISOString(),
        endTime: new Date(Date.now() + 90000000).toISOString(),
        status: 'pending',
        milestones: milestones
      };

      StorageService.saveBooking(newBooking);
      
      // Artificial delay for premium feel
      await new Promise(resolve => setTimeout(resolve, 600));
      
      onRefresh();
      alert(`Success! ${isTeacherOffering ? 'Offer' : 'Request'} sent to ${item.owner.name}. They've been notified with the AI-generated curriculum.`);
    } catch (error) {
      console.error("Booking failed:", error);
      alert("Something went wrong. Please try again.");
    } finally {
      setRequestingId(null);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-page pb-20">
      <div className="flex flex-col gap-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tight mb-2">Marketplace</h1>
            <p className="text-slate-500 dark:text-slate-400 font-medium">Connect with global talent and share your passion.</p>
          </div>
          
          <div className="flex p-1.5 bg-slate-200/50 dark:bg-slate-800/50 rounded-2xl w-full md:w-auto">
            <button 
              onClick={() => setFilter('offered')}
              className={`flex-1 md:flex-none px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${filter === 'offered' ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'}`}
            >
              Browse Skills
            </button>
            <button 
              onClick={() => setFilter('wanted')}
              className={`flex-1 md:flex-none px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${filter === 'wanted' ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'}`}
            >
              Skill Requests
            </button>
          </div>
        </div>

        <div className="flex flex-col md:flex-row gap-4 items-center">
          <div className="relative flex-1 w-full">
            <span className="absolute left-5 top-1/2 -translate-y-1/2 text-xl grayscale dark:invert opacity-50">🔍</span>
            <input 
              type="text" 
              placeholder={filter === 'offered' ? "What do you want to learn today?" : "Find someone to teach..."}
              className="w-full bg-white dark:bg-slate-800 border border-slate-200/60 dark:border-slate-700/60 rounded-[1.5rem] pl-14 pr-6 py-4 shadow-sm focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-600 outline-none transition-all font-medium text-slate-900 dark:text-white"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex gap-2 overflow-x-auto w-full md:w-auto pb-2 md:pb-0 scrollbar-hide">
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-5 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all border ${activeCategory === cat ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-950 border-slate-900 dark:border-white' : 'bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-500'}`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
        {filteredSkills.length === 0 ? (
          <div className="col-span-full py-24 text-center">
            <div className="text-6xl mb-6 grayscale opacity-20 dark:opacity-40">🏜️</div>
            <h3 className="text-xl font-black text-slate-900 dark:text-white">Quiet in the bazaar</h3>
            <p className="text-slate-500 dark:text-slate-400 mt-2 max-w-xs mx-auto">We couldn't find any results matching your search criteria.</p>
          </div>
        ) : (
          filteredSkills.map((item, i) => (
            <div key={`${item.owner.id}-${item.id}`} className="group bg-white dark:bg-slate-800 rounded-[2rem] border border-slate-200/50 dark:border-slate-700/50 shadow-sm hover:shadow-2xl hover:-translate-y-2 transition-all duration-500 flex flex-col overflow-hidden">
              <div className="p-8 flex-1">
                <div className="flex items-center justify-between mb-6">
                  <span className="px-3 py-1 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-lg text-[9px] font-black uppercase tracking-widest border border-indigo-100 dark:border-indigo-900/50">
                    {item.category}
                  </span>
                  <div className="flex items-center gap-1.5 px-2 py-1 bg-amber-50 dark:bg-amber-900/30 rounded-lg">
                    <span className="text-xs">⭐</span>
                    <span className="text-xs font-black text-amber-700 dark:text-amber-400">{item.owner.rating}</span>
                  </div>
                </div>
                
                <h3 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight mb-1 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">{item.name}</h3>
                <p className="text-sm text-slate-400 dark:text-slate-500 font-bold uppercase tracking-tighter mb-6">{item.proficiency} Level</p>
                
                <div className="flex items-center gap-4 pt-6 border-t border-slate-100 dark:border-slate-700">
                  <div className="relative">
                    <img src={item.owner.avatar} alt={item.owner.name} className="w-12 h-12 rounded-2xl object-cover ring-2 ring-slate-50 dark:ring-slate-700" />
                    <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 rounded-full border-2 border-white dark:border-slate-800"></div>
                  </div>
                  <div className="flex flex-col">
                    <p className="text-sm font-black text-slate-900 dark:text-white leading-tight">{item.owner.name}</p>
                    <p className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-widest">Available Mentor</p>
                  </div>
                </div>
              </div>
              
              <div className="px-8 pb-8">
                <button 
                  onClick={() => handleRequest(item)}
                  disabled={requestingId === `${item.owner.id}-${item.id}`}
                  className={`w-full py-4 rounded-2xl font-black text-xs uppercase tracking-widest transition-all flex items-center justify-center gap-3 ${requestingId === `${item.owner.id}-${item.id}` ? 'bg-slate-100 dark:bg-slate-700 text-slate-400 dark:text-slate-500 cursor-not-allowed' : 'bg-indigo-600 text-white shadow-xl shadow-indigo-100 dark:shadow-indigo-900/20 hover:bg-slate-900 dark:hover:bg-slate-700 hover:shadow-none'}`}
                >
                  {requestingId === `${item.owner.id}-${item.id}` ? (
                    <span className="flex items-center gap-2">
                      <span className="w-4 h-4 border-2 border-slate-300 border-t-indigo-600 rounded-full animate-spin"></span>
                      Processing...
                    </span>
                  ) : (filter === 'offered' ? 'Request Session' : 'Offer Guidance')}
                  {requestingId !== `${item.owner.id}-${item.id}` && <span className="text-lg opacity-50 group-hover:translate-x-1 transition-transform">→</span>}
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default Marketplace;
