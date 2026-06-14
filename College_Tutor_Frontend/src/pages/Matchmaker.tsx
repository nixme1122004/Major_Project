
import React, { useState, useEffect } from 'react';
import { User, MatchResult, Booking } from '../types';
import { StorageService } from '../services/storage';
import { AIService } from '../services/aiService';

interface MatchmakerProps {
  user: User;
  onRefresh: () => void;
}

const Matchmaker: React.FC<MatchmakerProps> = ({ user, onRefresh }) => {
  const [matches, setMatches] = useState<MatchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [connectingId, setConnectingId] = useState<string | null>(null);

  const runMatchmaker = async () => {
    setLoading(true);
    try {
      const allUsers = StorageService.getUsers();
      const results = await AIService.getMatches(user, allUsers);
      setMatches(results.sort((a, b) => b.score - a.score));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    runMatchmaker();
  }, [user.id]);

  const handleConnect = (match: MatchResult) => {
    setConnectingId(match.matchId);
    const targetUser = StorageService.getUserById(match.matchId);
    if (!targetUser) return;

    const newBooking: Booking = {
      id: Math.random().toString(36).substr(2, 9),
      teacherId: match.matchId,
      learnerId: user.id,
      skillId: 's-match-' + Math.random(),
      skillName: match.complementarySkills[0] || 'Peer Exchange',
      startTime: new Date(Date.now() + 172800000).toISOString(),
      endTime: new Date(Date.now() + 176400000).toISOString(),
      status: 'pending',
      milestones: []
    };

    StorageService.saveBooking(newBooking);
    
    setTimeout(() => {
      setConnectingId(null);
      alert(`Sent to ${targetUser.name}!`);
    }, 1000);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-10 animate-page pb-20">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="max-w-xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-50 text-indigo-600 rounded-full text-[10px] font-black uppercase tracking-widest mb-3 border border-indigo-100">
            <span className="animate-pulse">●</span> Powered by Gemini
          </div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight mb-2">Neural Matchmaker</h1>
          <p className="text-slate-500 font-medium">Our AI analyzes thousands of data points including proficiency, availability, and learning velocity to find your perfect knowledge partner.</p>
        </div>
        <button 
          onClick={runMatchmaker}
          disabled={loading}
          className="w-full md:w-auto bg-slate-900 text-white px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-indigo-600 transition-all flex items-center justify-center gap-3 disabled:opacity-50 neural-glow"
        >
          {loading ? 'Processing...' : 'Recalculate Matches ✨'}
        </button>
      </div>

      {loading ? (
        <div className="bg-white p-24 rounded-[3rem] border border-slate-200/50 flex flex-col items-center justify-center text-center shadow-sm">
          <div className="relative">
            <div className="w-24 h-24 border-[6px] border-indigo-100 border-t-indigo-600 rounded-full animate-spin mb-8"></div>
            <div className="absolute inset-0 flex items-center justify-center text-2xl animate-pulse">🧠</div>
          </div>
          <h3 className="text-2xl font-black text-slate-900 tracking-tight">Syncing Neural Networks...</h3>
          <p className="text-slate-500 max-w-sm mx-auto mt-3 font-medium leading-relaxed">Gemini is currently cross-referencing your goals with {StorageService.getUsers().length} active members.</p>
        </div>
      ) : matches.length === 0 ? (
        <div className="text-center py-24 bg-white rounded-[3rem] border border-slate-200/50">
          <div className="text-6xl mb-6 opacity-20">📡</div>
          <h3 className="text-2xl font-black text-slate-900">No Signal Found</h3>
          <p className="text-slate-500 mt-3 font-medium">Try adding more details to your profile to help the AI find better matches.</p>
        </div>
      ) : (
        <div className="grid gap-8">
          {matches.map((match) => {
            const matchUser = StorageService.getUserById(match.matchId);
            if (!matchUser) return null;

            return (
              <div key={match.matchId} className="group bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-200/50 hover:shadow-2xl hover:border-indigo-200 transition-all duration-500 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50/30 rounded-bl-[5rem] -mr-16 -mt-16 group-hover:bg-indigo-50/50 transition-colors"></div>
                
                <div className="flex flex-col md:flex-row gap-8 relative z-10">
                  <div className="relative shrink-0">
                    <img src={matchUser.avatar} alt={matchUser.name} className="w-32 h-32 rounded-[2rem] object-cover ring-4 ring-slate-50 group-hover:scale-105 transition-transform duration-500" />
                    <div className="absolute -bottom-3 -right-3 bg-white px-3 py-1.5 rounded-xl border border-indigo-100 flex items-center gap-1.5 shadow-xl">
                      <span className="text-sm font-black text-indigo-600">{match.score}%</span>
                    </div>
                  </div>
                  
                  <div className="flex-1 space-y-6">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div>
                        <h3 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                          {matchUser.name}
                          {matchUser.isVerified && <span className="bg-blue-50 text-blue-500 text-[10px] px-2 py-0.5 rounded-full border border-blue-100 font-black uppercase">Verified</span>}
                        </h3>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-sm font-bold text-slate-400">Expertise: {matchUser.skillsOffered[0]?.name || 'Various'}</span>
                          <span className="text-slate-200">•</span>
                          <span className="text-sm font-bold text-slate-400">{matchUser.reviewCount} Reviews</span>
                        </div>
                      </div>
                      <button 
                        onClick={() => handleConnect(match)}
                        disabled={connectingId === match.matchId}
                        className="bg-slate-900 text-white px-8 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-indigo-600 transition-all shadow-xl shadow-slate-200 hover:shadow-indigo-100 disabled:opacity-50"
                      >
                        {connectingId === match.matchId ? 'Inquiry Sent' : 'Request Connection'}
                      </button>
                    </div>

                    <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 relative group-hover:bg-white transition-colors">
                      <p className="text-sm text-slate-600 font-medium leading-relaxed italic">
                        <span className="text-indigo-400 mr-2 font-black not-italic">"</span>
                        {match.reason}
                        <span className="text-indigo-400 ml-1 font-black not-italic">"</span>
                      </p>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest w-full mb-1">Bridge Skills</span>
                      {match.complementarySkills.map((skill, i) => (
                        <span key={i} className="px-4 py-1.5 bg-white text-indigo-600 border border-indigo-100 rounded-xl text-xs font-black uppercase tracking-tighter shadow-sm">
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Matchmaker;
