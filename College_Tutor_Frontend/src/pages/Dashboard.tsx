
import React, { useState, useEffect } from 'react';
import { User, Booking, Proficiency } from '../types';
import { StorageService } from '../services/storage';

interface DashboardProps {
  user: User;
  onNavigate: (page: any) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ user, onNavigate }) => {
  const [bookings, setBookings] = useState<Booking[]>([]);

  const fetchBookings = () => {
    const allBookings = StorageService.getBookings();
    // Fetch all bookings where user is involved
    const userBookings = allBookings.filter(b => b.teacherId === user.id || b.learnerId === user.id);
    setBookings(userBookings);
  };

  useEffect(() => {
    fetchBookings();
  }, [user.id]);

  const handleStatusUpdate = (booking: Booking, status: Booking['status']) => {
    const updated = { ...booking, status };
    StorageService.updateBooking(updated);
    fetchBookings();
  };

  const upcomingSessions = bookings.filter(b => b.status === 'confirmed');
  
  // Logic Fix: Pending requests should show to the RECIPIENT.
  // - If learner requests teacher: Teacher sees it (learnerId !== user.id).
  // - If teacher offers learner: Learner sees it (teacherId !== user.id).
  const pendingRequests = bookings.filter(b => {
    if (b.status !== 'pending') return false;
    
    // Check if the current user is the target of the action
    // In our model, teacher usually accepts learner, but if teacher offers, learner accepts teacher.
    // For now, let's simplify: Any pending booking where the OTHER person started it.
    // We assume the person whose dashboard we are on is the 'approver'.
    const isTeacherPending = b.teacherId === user.id;
    const isLearnerPending = b.learnerId === user.id;

    return isTeacherPending || isLearnerPending;
  });

  const stats = [
    { label: 'Taught', value: bookings.filter(b => b.teacherId === user.id && b.status === 'completed').length, icon: '🎓', color: 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400' },
    { label: 'Learned', value: bookings.filter(b => b.learnerId === user.id && b.status === 'completed').length, icon: '💡', color: 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400' },
    { label: 'Points', value: user.points, icon: '⭐️', color: 'bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400' },
    { label: 'Rating', value: user.rating.toFixed(1), icon: '⭐', color: 'bg-rose-50 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400' },
  ];

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-page">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        {stats.map((stat, i) => (
          <div key={i} className="bg-white dark:bg-slate-800 p-6 rounded-3xl shadow-sm border border-slate-200/50 dark:border-slate-700/50 hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
            <div className={`text-xl ${stat.color} w-10 h-10 flex items-center justify-center rounded-xl mb-4`}>{stat.icon}</div>
            <p className="text-[10px] text-slate-400 dark:text-slate-500 font-extrabold uppercase tracking-widest mb-1">{stat.label}</p>
            <p className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter">{stat.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          {/* Active Sessions */}
          <section className="bg-white dark:bg-slate-800 rounded-[2rem] shadow-sm border border-slate-200/50 dark:border-slate-700/50 overflow-hidden">
            <div className="px-8 py-6 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between">
              <h3 className="font-extrabold text-slate-900 dark:text-white tracking-tight">Active Learning</h3>
              <button onClick={() => onNavigate('marketplace')} className="text-xs text-indigo-600 dark:text-indigo-400 font-bold bg-indigo-50 dark:bg-indigo-900/30 px-3 py-1.5 rounded-lg hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition-all">Explore Marketplace</button>
            </div>
            <div className="p-8">
              {upcomingSessions.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-20 h-20 bg-slate-50 dark:bg-slate-900 rounded-full flex items-center justify-center mx-auto mb-4 text-3xl opacity-50">🗓️</div>
                  <h4 className="text-slate-800 dark:text-slate-200 font-bold mb-1">No active sessions</h4>
                  <p className="text-sm text-slate-400 dark:text-slate-500">Ready to learn something new? Check the marketplace.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {upcomingSessions.map(session => (
                    <div key={session.id} className="group p-5 rounded-2xl border border-slate-100 dark:border-slate-700 bg-white dark:bg-slate-800/50 hover:border-indigo-100 dark:hover:border-indigo-900 hover:shadow-lg transition-all">
                      <div className="flex flex-col sm:flex-row sm:items-center gap-5">
                        <div className="w-14 h-14 bg-indigo-50 dark:bg-indigo-900/30 border border-indigo-100 dark:border-indigo-900/50 text-indigo-700 dark:text-indigo-400 flex flex-col items-center justify-center rounded-2xl font-black shadow-sm group-hover:scale-105 transition-transform">
                          <span className="text-[10px] uppercase leading-none mb-1">{new Date(session.startTime).toLocaleString('default', { month: 'short' })}</span>
                          <span className="text-xl leading-none">{new Date(session.startTime).getDate()}</span>
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="px-2 py-0.5 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 text-[10px] font-black uppercase rounded">Session</span>
                            <h4 className="font-extrabold text-slate-900 dark:text-white">{session.skillName}</h4>
                          </div>
                          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                            {session.teacherId === user.id ? 'Instructing ' : 'Tutored by '} 
                            <span className="text-indigo-600 dark:text-indigo-400 font-bold">
                              {StorageService.getUserById(session.teacherId === user.id ? session.learnerId : session.teacherId)?.name}
                            </span>
                          </p>
                        </div>
                        <div className="flex items-center gap-3">
                          <button 
                            onClick={() => handleStatusUpdate(session, 'completed')}
                            className="px-4 py-2 bg-emerald-600 text-white text-xs font-bold rounded-xl shadow-lg shadow-emerald-100 dark:shadow-emerald-950/20 hover:bg-emerald-700 transition-all"
                          >
                            Finish
                          </button>
                          <button className="w-10 h-10 flex items-center justify-center bg-slate-900 dark:bg-slate-700 text-white rounded-xl hover:scale-105 transition-all">
                            ▶
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>

          {/* Pending Requests & Offers */}
          {pendingRequests.length > 0 && (
            <section className="bg-white dark:bg-slate-800 rounded-[2rem] shadow-sm border border-slate-200/50 dark:border-slate-700/50 overflow-hidden">
              <div className="px-8 py-6 border-b border-slate-100 dark:border-slate-700 bg-slate-50/30 dark:bg-slate-900/30">
                <h3 className="font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
                  Exchange Inbox
                  <span className="w-5 h-5 bg-indigo-600 text-white text-[10px] flex items-center justify-center rounded-full">{pendingRequests.length}</span>
                </h3>
              </div>
              <div className="p-8 space-y-4">
                {pendingRequests.map(req => {
                  const isIncomingOffer = req.learnerId === user.id;
                  const partner = StorageService.getUserById(isIncomingOffer ? req.teacherId : req.learnerId);
                  
                  return (
                    <div key={req.id} className="p-5 rounded-2xl bg-slate-50/50 dark:bg-slate-900/30 border border-slate-100 dark:border-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="flex items-center gap-4">
                        <img 
                          src={partner?.avatar} 
                          className="w-12 h-12 rounded-xl object-cover" 
                          alt="" 
                        />
                        <div>
                          <p className="text-sm font-extrabold text-slate-900 dark:text-white">{partner?.name}</p>
                          <p className="text-xs text-slate-500 dark:text-slate-400">
                            {isIncomingOffer ? (
                              <>Offered to teach you <span className="text-indigo-600 dark:text-indigo-400 font-bold">{req.skillName}</span></>
                            ) : (
                              <>Wants to learn <span className="text-indigo-600 dark:text-indigo-400 font-bold">{req.skillName}</span> from you</>
                            )}
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button 
                          onClick={() => handleStatusUpdate(req, 'confirmed')}
                          className="flex-1 sm:flex-none px-6 py-2 bg-indigo-600 text-white text-xs font-bold rounded-xl shadow-md hover:bg-indigo-700 transition-all"
                        >
                          {isIncomingOffer ? 'Accept Offer' : 'Accept Request'}
                        </button>
                        <button 
                          onClick={() => handleStatusUpdate(req, 'cancelled')}
                          className="flex-1 sm:flex-none px-6 py-2 bg-white dark:bg-slate-700 text-slate-400 dark:text-slate-300 border border-slate-200 dark:border-slate-600 text-xs font-bold rounded-xl hover:bg-slate-50 dark:hover:bg-slate-600 transition-all"
                        >
                          Decline
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          )}
        </div>

        {/* Sidebar Widgets */}
        <div className="space-y-8">
          <section className="bg-white dark:bg-slate-800 p-8 rounded-[2rem] shadow-sm border border-slate-200/50 dark:border-slate-700/50">
            <h3 className="font-extrabold text-slate-900 dark:text-white tracking-tight mb-6">Unlocked Badges</h3>
            <div className="grid grid-cols-3 gap-6">
              {user.badges.map((badge, i) => (
                <div key={i} className="flex flex-col items-center gap-2 group cursor-default">
                  <div className="w-14 h-14 bg-indigo-50 dark:bg-indigo-900/30 border border-indigo-100 dark:border-indigo-900/50 rounded-2xl flex items-center justify-center text-2xl group-hover:rotate-12 group-hover:scale-110 transition-all duration-300">
                    {badge === 'Mentor' ? '👨‍🏫' : badge === 'Artist' ? '🎨' : badge === 'Expert' ? '🎖️' : '🏅'}
                  </div>
                  <span className="text-[8px] font-black text-slate-400 dark:text-slate-500 text-center uppercase tracking-widest">{badge}</span>
                </div>
              ))}
              <div className="flex flex-col items-center gap-2">
                <div className="w-14 h-14 bg-slate-50 dark:bg-slate-900 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-700 flex items-center justify-center text-xl text-slate-200 dark:text-slate-700">
                  +
                </div>
                <span className="text-[8px] font-black text-slate-200 dark:text-slate-700 text-center uppercase tracking-widest">Locked</span>
              </div>
            </div>
          </section>

          <section className="bg-gradient-to-br from-slate-900 to-indigo-950 p-8 rounded-[2rem] shadow-2xl text-white">
            <h3 className="font-extrabold text-white tracking-tight mb-6 flex items-center gap-2">
              Neural Stats
              <span className="text-[10px] bg-indigo-500/20 text-indigo-400 px-2 py-0.5 rounded-full border border-indigo-500/30">AI Live</span>
            </h3>
            <div className="space-y-6">
              {user.skillsOffered.map(skill => (
                <div key={skill.id} className="space-y-2">
                  <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-indigo-300/80">
                    <span>{skill.name}</span>
                    <span>{skill.proficiency}</span>
                  </div>
                  <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-indigo-400 to-emerald-400 rounded-full transition-all duration-1000" 
                      style={{ width: skill.proficiency === Proficiency.EXPERT ? '100%' : skill.proficiency === Proficiency.ADVANCED ? '75%' : '50%' }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
