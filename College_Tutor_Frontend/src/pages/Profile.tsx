
import React, { useState, useRef } from 'react';
import { User, Proficiency, Skill } from '../types';
import { StorageService } from '../services/storage';

interface ProfileProps {
  user: User;
  onUpdate: () => void;
}

const Profile: React.FC<ProfileProps> = ({ user, onUpdate }) => {
  const [editing, setEditing] = useState(false);
  const [showAddSkill, setShowAddSkill] = useState(false);
  const [newSkill, setNewSkill] = useState({ 
    name: '', 
    category: 'Programming', 
    proficiency: Proficiency.BEGINNER,
    type: 'offered' as 'offered' | 'wanted'
  });
  const [formData, setFormData] = useState({
    name: user.name,
    bio: user.bio,
    location: user.location || '',
    avatar: user.avatar
  });

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSave = () => {
    const updatedUser = { ...user, ...formData };
    StorageService.updateUser(updatedUser);
    onUpdate();
    setEditing(false);
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setFormData(prev => ({ ...prev, avatar: event.target?.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAddSkill = () => {
    if (!newSkill.name) return;
    const isOffered = newSkill.type === 'offered';
    const skill: Skill = {
      id: 's-' + Math.random().toString(36).substr(2, 9),
      name: newSkill.name,
      category: newSkill.category,
      proficiency: newSkill.proficiency,
      isOffered: isOffered
    };

    const updatedUser = { ...user };
    if (isOffered) {
      updatedUser.skillsOffered = [...user.skillsOffered, skill];
    } else {
      updatedUser.skillsWanted = [...user.skillsWanted, skill];
    }

    StorageService.updateUser(updatedUser);
    onUpdate();
    setShowAddSkill(false);
    setNewSkill({ name: '', category: 'Programming', proficiency: Proficiency.BEGINNER, type: 'offered' });
  };

  const handleRemoveSkill = (id: string, isOffered: boolean) => {
    const updatedUser = { ...user };
    if (isOffered) {
      updatedUser.skillsOffered = user.skillsOffered.filter(s => s.id !== id);
    } else {
      updatedUser.skillsWanted = user.skillsWanted.filter(s => s.id !== id);
    }
    StorageService.updateUser(updatedUser);
    onUpdate();
  };

  const categories = ['Programming', 'Arts', 'Cooking', 'Fitness', 'Music', 'Languages', 'Business', 'Marketing'];

  return (
    <div className="max-w-4xl mx-auto space-y-10 pb-24 animate-page">
      <div className="bg-white dark:bg-slate-800 rounded-[3rem] shadow-sm border border-slate-200/50 dark:border-slate-700/50 overflow-hidden relative transition-colors">
        <div className="h-48 bg-slate-900 flex items-center justify-center overflow-hidden relative">
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-600/20 to-emerald-600/20"></div>
          <div className="w-full h-full opacity-10 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:20px_20px]"></div>
        </div>
        
        <div className="px-10 pb-10 -mt-20 relative z-10">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
            <div className="space-y-5">
              <div className="relative inline-block group">
                <img 
                  src={editing ? formData.avatar : user.avatar} 
                  className="w-40 h-40 rounded-[2.5rem] object-cover border-[6px] border-white dark:border-slate-800 shadow-2xl transition-colors" 
                  alt="" 
                />
                <div className="absolute bottom-2 right-2 w-6 h-6 bg-emerald-500 rounded-full border-4 border-white dark:border-slate-800"></div>
                
                {editing && (
                  <>
                    <button 
                      onClick={() => fileInputRef.current?.click()}
                      className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-[2.5rem] opacity-0 group-hover:opacity-100 transition-opacity text-white font-bold text-xs uppercase tracking-widest"
                    >
                      Change Photo
                    </button>
                    <input 
                      type="file" 
                      ref={fileInputRef} 
                      className="hidden" 
                      accept="image/*" 
                      onChange={handleAvatarChange} 
                    />
                  </>
                )}
              </div>
              <div>
                {editing ? (
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest px-1">Display Name</label>
                    <input 
                      type="text" 
                      className="text-2xl font-black bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2 outline-none focus:ring-2 focus:ring-indigo-600 text-slate-900 dark:text-white"
                      value={formData.name}
                      onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    />
                  </div>
                ) : (
                  <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-3">
                    {user.name}
                    <span className="bg-blue-50 dark:bg-blue-900/30 text-blue-500 dark:text-blue-400 text-[10px] px-3 py-1 rounded-full border border-blue-100 dark:border-blue-900/50 font-black uppercase tracking-widest">PRO</span>
                  </h1>
                )}
                <p className="text-slate-400 dark:text-slate-500 font-bold flex items-center gap-2 mt-1 uppercase text-xs tracking-tighter">
                  📍 {editing ? (
                    <input 
                      type="text" 
                      className="bg-transparent border-b border-slate-200 dark:border-slate-700 outline-none focus:border-indigo-600" 
                      placeholder="Enter location"
                      value={formData.location}
                      onChange={e => setFormData(prev => ({ ...prev, location: e.target.value }))}
                    />
                  ) : (user.location || 'Global Educator')} • Member since {new Date(user.joinedDate).getFullYear()}
                </p>
              </div>
            </div>
            <button 
              onClick={() => editing ? handleSave() : setEditing(true)}
              className="px-10 py-4 bg-slate-900 dark:bg-slate-700 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-indigo-600 transition-all shadow-xl shadow-slate-200 dark:shadow-slate-900 hover:shadow-indigo-100"
            >
              {editing ? 'Update Profile' : 'Edit Credentials'}
            </button>
          </div>

          <div className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-12">
            <div className="space-y-10">
              <section className="space-y-4">
                <h3 className="font-black text-slate-400 dark:text-slate-500 uppercase text-[10px] tracking-widest border-b border-slate-100 dark:border-slate-700 pb-2">Bio & Philosophy</h3>
                {editing ? (
                  <textarea 
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl p-5 min-h-[140px] outline-none focus:ring-2 focus:ring-indigo-600 focus:bg-white dark:focus:bg-slate-900 transition-all font-medium text-slate-700 dark:text-slate-300"
                    value={formData.bio}
                    onChange={e => setFormData(prev => ({ ...prev, bio: e.target.value }))}
                  />
                ) : (
                  <p className="text-slate-600 dark:text-slate-300 leading-relaxed font-medium">{user.bio}</p>
                )}
              </section>

              <section className="space-y-6">
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-700 pb-2">
                  <h3 className="font-black text-slate-400 dark:text-slate-500 uppercase text-[10px] tracking-widest">Expertise</h3>
                  <button 
                    onClick={() => { setNewSkill(prev => ({ ...prev, type: 'offered' })); setShowAddSkill(true); }} 
                    className="text-indigo-600 dark:text-indigo-400 font-black text-[10px] uppercase tracking-widest hover:underline"
                  >
                    + New Skill
                  </button>
                </div>
                <div className="space-y-4">
                  {user.skillsOffered.length === 0 ? (
                    <p className="text-xs text-slate-400 dark:text-slate-500 italic">No credentials listed.</p>
                  ) : (
                    user.skillsOffered.map(skill => (
                      <div key={skill.id} className="group flex items-center justify-between p-5 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-100 dark:border-slate-700 hover:border-indigo-100 dark:hover:border-indigo-900 hover:bg-white dark:hover:bg-slate-900 transition-all">
                        <div>
                          <p className="font-black text-slate-900 dark:text-white text-sm tracking-tight">{skill.name}</p>
                          <p className="text-[9px] text-slate-400 dark:text-slate-500 uppercase font-black tracking-widest">{skill.category}</p>
                        </div>
                        <div className="flex items-center gap-4">
                          <span className="px-3 py-1 bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-900/50 rounded-lg text-[9px] font-black uppercase tracking-widest">{skill.proficiency}</span>
                          <button onClick={() => handleRemoveSkill(skill.id, true)} className="text-slate-300 dark:text-slate-600 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all text-xl">×</button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </section>
            </div>

            <div className="space-y-10">
              <section className="space-y-6">
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-700 pb-2">
                  <h3 className="font-black text-slate-400 dark:text-slate-500 uppercase text-[10px] tracking-widest">Curiosity Goals</h3>
                  <button 
                    onClick={() => { setNewSkill(prev => ({ ...prev, type: 'wanted' })); setShowAddSkill(true); }} 
                    className="text-indigo-600 dark:text-indigo-400 font-black text-[10px] uppercase tracking-widest hover:underline"
                  >
                    + Want to Learn
                  </button>
                </div>
                <div className="flex flex-wrap gap-3">
                  {user.skillsWanted.length === 0 ? (
                    <p className="text-xs text-slate-400 dark:text-slate-500 italic">No active goals.</p>
                  ) : (
                    user.skillsWanted.map(skill => (
                      <div key={skill.id} className="group flex items-center gap-2 px-5 py-2.5 bg-slate-900 dark:bg-slate-950 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all hover:bg-indigo-600 hover:scale-105">
                        <span>{skill.name}</span>
                        <span className="text-slate-500 dark:text-slate-400 group-hover:text-indigo-200">({skill.proficiency})</span>
                        <button onClick={() => handleRemoveSkill(skill.id, false)} className="ml-1 text-slate-500 hover:text-white transition-colors text-lg font-light">×</button>
                      </div>
                    ))
                  )}
                </div>
              </section>

              <section className="space-y-6">
                <h3 className="font-black text-slate-400 dark:text-slate-500 uppercase text-[10px] tracking-widest border-b border-slate-100 dark:border-slate-700 pb-2">Reputation Index</h3>
                <div className="bg-gradient-to-br from-amber-50 to-orange-50 dark:from-slate-900/50 dark:from-amber-950/20 p-8 rounded-[2rem] border border-amber-100/50 dark:border-amber-900/30 space-y-6">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-black text-amber-800 dark:text-amber-400 uppercase tracking-widest">Trust Ranking</span>
                    <span className="text-3xl font-black text-amber-900 dark:text-amber-100">{(user.rating * 20).toFixed(0)}</span>
                  </div>
                  <div className="h-2 w-full bg-white/50 dark:bg-slate-800/50 rounded-full overflow-hidden">
                    <div className="h-full bg-amber-500 rounded-full transition-all duration-1000" style={{ width: `${user.rating * 20}%` }}></div>
                  </div>
                  <div className="flex items-center gap-4 pt-2">
                    <div className="flex -space-x-3">
                      {[1,2,3].map(i => <div key={i} className="w-8 h-8 rounded-full bg-amber-200 dark:bg-amber-900 border-2 border-amber-50 dark:border-slate-800 flex items-center justify-center text-[10px]">👤</div>)}
                    </div>
                    <p className="text-[10px] text-amber-700 dark:text-amber-500 font-bold leading-tight uppercase tracking-tighter">Vouched by 24 local mentors</p>
                  </div>
                </div>
              </section>
            </div>
          </div>
        </div>

        {/* Modal with premium styling */}
        {showAddSkill && (
          <div className="fixed inset-0 bg-slate-900/80 flex items-center justify-center z-[100] p-6 backdrop-blur-xl animate-in fade-in duration-300">
            <div className="bg-white dark:bg-slate-800 rounded-[3rem] p-10 w-full max-w-lg space-y-8 shadow-2xl scale-in-center transition-colors">
              <div className="flex justify-between items-center">
                <h3 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">Expand Portfolio</h3>
                <button onClick={() => setShowAddSkill(false)} className="w-10 h-10 flex items-center justify-center bg-slate-50 dark:bg-slate-900 rounded-full text-slate-400 hover:text-slate-900 dark:hover:text-white transition-all text-2xl font-light">×</button>
              </div>

              <div className="space-y-6">
                <div className="flex p-1.5 bg-slate-100 dark:bg-slate-900 rounded-2xl">
                  <button onClick={() => setNewSkill(prev => ({ ...prev, type: 'offered' }))} className={`flex-1 py-3 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all ${newSkill.type === 'offered' ? 'bg-white dark:bg-slate-700 shadow-sm text-indigo-600 dark:text-indigo-400' : 'text-slate-500 dark:text-slate-400'}`}>Teacher Mode</button>
                  <button onClick={() => setNewSkill(prev => ({ ...prev, type: 'wanted' }))} className={`flex-1 py-3 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all ${newSkill.type === 'wanted' ? 'bg-white dark:bg-slate-700 shadow-sm text-indigo-600 dark:text-indigo-400' : 'text-slate-500 dark:text-slate-400'}`}>Learner Mode</button>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest px-1">Subject Matter</label>
                  <input type="text" autoFocus className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl px-6 py-4 outline-none focus:ring-4 focus:ring-indigo-600/10 focus:border-indigo-600 transition-all font-bold text-slate-900 dark:text-white" placeholder="What are we talking about?" value={newSkill.name} onChange={e => setNewSkill(prev => ({ ...prev, name: e.target.value }))} />
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest px-1">Domain</label>
                    <select className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl px-6 py-4 outline-none focus:ring-4 focus:ring-indigo-600/10 focus:border-indigo-600 font-bold transition-all appearance-none text-slate-900 dark:text-white" value={newSkill.category} onChange={e => setNewSkill(prev => ({ ...prev, category: e.target.value }))}>
                      {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest px-1">Proficiency</label>
                    <select className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl px-6 py-4 outline-none focus:ring-4 focus:ring-indigo-600/10 focus:border-indigo-600 font-bold transition-all appearance-none text-slate-900 dark:text-white" value={newSkill.proficiency} onChange={e => setNewSkill(prev => ({ ...prev, proficiency: e.target.value as Proficiency }))}>
                      {Object.values(Proficiency).map(p => <option key={p} value={p}>{p}</option>)}
                    </select>
                  </div>
                </div>
              </div>

              <div className="flex gap-4 pt-4">
                <button onClick={() => setShowAddSkill(false)} className="flex-1 py-4 font-black text-slate-400 dark:text-slate-500 hover:text-slate-900 dark:hover:text-white transition-all text-xs uppercase tracking-widest">Cancel</button>
                <button onClick={handleAddSkill} disabled={!newSkill.name} className="flex-[2] py-4 bg-slate-900 dark:bg-indigo-600 text-white font-black rounded-2xl hover:bg-indigo-600 dark:hover:bg-indigo-700 shadow-2xl shadow-slate-200 dark:shadow-none hover:shadow-indigo-100 transition-all disabled:opacity-50 text-xs uppercase tracking-widest">Confirm & Save</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Profile;
