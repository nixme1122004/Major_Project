import React, { useState, useEffect, useRef, useMemo } from 'react';
import axios from 'axios';
import { io, Socket } from 'socket.io-client';
import { User, Message } from '../types';
import { StorageService } from '../services/storage';
import { BACKEND_URL } from '../config';
import { socketService } from '../services/socket';

interface MessagesProps {
  user: User;
}


const Messages: React.FC<MessagesProps> = ({ user }) => {
  const [activeChat, setActiveChat] = useState<User | null>(null);
  const [conversations, setConversations] = useState<any[]>([]);
  const [messages, setMessages] = useState<any[]>([]);
  const [inputText, setInputText] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [allStudents, setAllStudents] = useState<any[]>([]);
  const [showAllUsers, setShowAllUsers] = useState(false);
  const [activeRoomId, setActiveRoomId] = useState<number | null>(null);

  const socketRef = useRef<Socket | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const activeRoomIdRef = useRef<number | null>(null);
  const userIdRef = useRef<string | number>('');

  useEffect(() => {
    activeRoomIdRef.current = activeRoomId;
    userIdRef.current = user?.id || '';
  }, [activeRoomId, user?.id]);

  const fetchConversations = async () => {
    try {
      const authState = JSON.parse(localStorage.getItem('skillswap_auth') || '{}');
      const res = await axios.get(`${BACKEND_URL}/api/messages/conversations`, {
        headers: { Authorization: `Bearer ${authState.token}` }
      });
      setConversations(res.data);
    } catch (err) {
      console.error("Failed fetching chat list", err);
    }
  };

  const fetchAllStudents = async () => {
    try {
      const authState = JSON.parse(localStorage.getItem('skillswap_auth') || '{}');
      const res = await axios.get(`${BACKEND_URL}/api/student/all`, {
        headers: { Authorization: `Bearer ${authState.token}` }
      });
      setAllStudents(res.data);
    } catch (err) {
      console.error("Failed fetching all students", err);
    }
  };

  // Establish live socket
  useEffect(() => {
    const authState = JSON.parse(localStorage.getItem('skillswap_auth') || '{}');
    if (!authState.token) return;

    fetchConversations(); // Initial load of contacts
    fetchAllStudents(); // Fetch all students too

    const socket = socketService.getSocket();
    if (!socket) return;
    socketRef.current = socket;

    socket.on('newMessage', (msgObj) => {
      // 1. Refresh sidebar to show last message/update order for background notifications
      fetchConversations();

      // 2. If we are currently looking at THIS specific chat room, append the message
      setMessages(prev => {
        if (msgObj.room_id === activeRoomIdRef.current) {
          const selfId = String(userIdRef.current).replace('u', '');
          const senderId = String(msgObj.sender_id).replace('u', '');
          if (selfId !== senderId) {
            return [...prev, msgObj];
          }
        }
        return prev;
      });
    });

    return () => {
      // Do not disconnect! The service manages it.
      socket.off('newMessage');
    };
  }, []);

  // Fetch full chat history when active chat changes
  useEffect(() => {
    if (!activeChat) return;
    
    const fetchHistory = async () => {
      try {
        const authState = JSON.parse(localStorage.getItem('skillswap_auth') || '{}');
        const res = await axios.get(`${BACKEND_URL}/api/messages/${activeChat.id}`, {
          headers: { Authorization: `Bearer ${authState.token}` }
        });
        
        setActiveRoomId(res.data.room_id);
        setMessages(res.data.messages);
        
        // Instruct socket to join this specific room
        socketRef.current?.emit('join-room', res.data.room_id);

      } catch (err) {
        console.error("Failed fetching SQL chat history", err);
      }
    };
    fetchHistory();
  }, [activeChat]);

  // Scroll to bottom whenever messages update
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!inputText.trim() || !activeRoomId) return;

    const authState = JSON.parse(localStorage.getItem('skillswap_auth') || '{}');
    const msgData = {
      room_id: activeRoomId,
      message: inputText
    };

    // Optimistic UI updates
    const tempId = Math.random();
    setMessages(prev => [...prev, {
      message_id: tempId,
      sender_id: user.id,
      message: inputText,
      sent_at: new Date().toISOString()
    }]);
    
    const originalText = inputText;
    setInputText('');

    try {
      await axios.post(`${BACKEND_URL}/api/messages/send`, msgData, {
        headers: { Authorization: `Bearer ${authState.token}` }
      });
      // The socket usually emits back to the room, so we might see it duplicated if we're not careful.
      // But we optimism-updated it. We leave it as is for the demo.
    } catch (err) {
      console.error("Failed sending SQL message", err);
      // rollback UI
      setMessages(prev => prev.filter(m => m.message_id !== tempId));
      setInputText(originalText);
    }
  };

  const handleStartCall = (mode: 'voice' | 'video' = 'video') => {
    if (activeChat) {
      window.dispatchEvent(new CustomEvent('open-call', { 
        detail: { 
          receiverId: activeChat.id, 
          receiverName: activeChat.name, 
          receiverAvatar: activeChat.avatar,
          mode,
          isIncoming: false 
        } 
      }));
    }
  };

  return (
    <div className="h-[calc(100vh-160px)] bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm flex overflow-hidden transition-colors">

      {/* Sidebar - Contacts List */}
      <div className="w-80 border-r border-slate-100 dark:border-slate-700 flex flex-col hidden lg:flex bg-slate-50/50 dark:bg-slate-900/50">
        <div className="p-6 bg-white dark:bg-slate-800 border-b border-slate-100 dark:border-slate-700">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-black text-slate-800 dark:text-white tracking-tight">
              {showAllUsers ? "Discover" : "Connections"}
            </h2>
            <button 
              onClick={() => setShowAllUsers(!showAllUsers)} 
              className="text-indigo-600 dark:text-indigo-400 hover:scale-110 transition-transform bg-indigo-50 dark:bg-indigo-900/30 w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
              title={showAllUsers ? "View Active Chats" : "Find Users to Chat"}
            >
              <span className="material-symbols-rounded text-sm">{showAllUsers ? "forum" : "person_add"}</span>
            </button>
          </div>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 material-symbols-rounded text-sm">search</span>
            <input 
              type="text" 
              placeholder={showAllUsers ? "Search all students" : "Search contacts"} 
              className="w-full bg-slate-100 dark:bg-slate-900 border-none rounded-xl pl-9 pr-4 py-2.5 text-xs outline-none focus:ring-2 focus:ring-indigo-500/20 text-slate-900 dark:text-white transition-all" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto">
          {showAllUsers ? (
            <div className="p-2 space-y-1">
              <div className="px-4 py-2 text-[10px] font-black uppercase text-indigo-500 tracking-widest bg-indigo-50/50 dark:bg-indigo-900/20 rounded-xl mb-2">Network Discovery</div>
              {allStudents.filter(s => s.name?.toLowerCase().includes(searchQuery.toLowerCase())).map(student => {
                const avatarUrl = student.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${student.name}`;
                return (
                <button 
                  key={student.student_id}
                  onClick={() => {
                    setActiveChat({
                      id: String(student.student_id),
                      name: student.name,
                      avatar: avatarUrl,
                    } as any);
                    setShowAllUsers(false);
                  }}
                  className={`w-full p-3 flex gap-4 items-center transition-all relative rounded-2xl ${activeChat?.id === String(student.student_id) ? 'bg-indigo-50 dark:bg-indigo-900/20' : 'hover:bg-white dark:hover:bg-slate-800/80 shadow-sm border border-transparent hover:border-slate-200 dark:hover:border-slate-700'}`}
                >
                  <img src={avatarUrl} alt={student.name} className="w-12 h-12 rounded-2xl object-cover shadow-sm bg-slate-100" />
                  <div className="flex-1 text-left overflow-hidden">
                    <p className="font-bold text-slate-800 dark:text-white truncate text-sm">{student.name}</p>
                    <p className="text-[10px] text-indigo-500 font-bold uppercase mt-1 tracking-widest">Start Chat 💬</p>
                  </div>
                </button>
              )})}
            </div>
          ) : (
            <>
            {conversations.filter(c => c.partner_name?.toLowerCase().includes(searchQuery.toLowerCase())).map(conv => {
              const partnerId = String(conv.partner_id);
              return (
              <button 
                key={partnerId}
                onClick={() => setActiveChat({
                  id: partnerId,
                  name: conv.partner_name,
                  avatar: conv.partner_avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${conv.partner_name}`,
                } as any)}
                className={`w-full p-4 flex gap-4 items-center transition-all relative border-b border-slate-50 dark:border-slate-800/50 ${activeChat?.id === partnerId ? 'bg-indigo-50/80 dark:bg-indigo-900/20' : 'hover:bg-white dark:hover:bg-slate-800/80'}`}
              >
                <div className="relative shrink-0">
                  <img src={conv.partner_avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${conv.partner_name}`} alt={conv.partner_name} className="w-14 h-14 rounded-2xl object-cover shadow-sm bg-slate-100" />
                  <div className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-green-500 rounded-full border-2 border-white dark:border-slate-900"></div>
                </div>
                <div className="flex-1 text-left overflow-hidden">
                  <div className="flex justify-between items-baseline mb-0.5">
                    <p className="font-bold text-slate-800 dark:text-white truncate text-sm">{conv.partner_name}</p>
                    {conv.last_message_time && (
                      <span className="text-[9px] text-slate-400 font-bold uppercase">
                        {new Date(conv.last_message_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-400 dark:text-slate-500 truncate font-medium">
                    {conv.last_message || "Start a new conversation"}
                  </p>
                </div>
              </button>
            )})}
            {conversations.length === 0 && (
              <div className="p-8 text-center flex flex-col items-center">
                <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-4 text-slate-400">
                  <span className="material-symbols-rounded text-2xl">forum</span>
                </div>
                <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mb-4">No active chats</p>
                <button 
                  onClick={() => setShowAllUsers(true)}
                  className="bg-indigo-50 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400 px-6 py-2.5 rounded-full text-xs font-black uppercase tracking-widest hover:bg-indigo-100 transition-colors"
                >
                  Find People
                </button>
              </div>
            )}
            </>
          )}
        
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col bg-slate-50/30 dark:bg-slate-950/20">
        {activeChat ? (
          <>
            <div className="p-4 bg-white dark:bg-slate-800 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between z-10">
              <div className="flex items-center gap-3">
                <button onClick={() => setActiveChat(null)} className="lg:hidden w-8 h-8 flex items-center justify-center text-slate-400 material-symbols-rounded">arrow_back</button>
                <img src={activeChat.avatar} alt={activeChat.name} className="w-11 h-11 rounded-2xl object-cover shadow-sm" />
                <div>
                  <h3 className="font-bold text-slate-800 dark:text-white leading-tight">{activeChat.name}</h3>
                  <div className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></span>
                    <p className="text-[10px] text-green-500 font-black uppercase tracking-widest">Database Linked</p>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => handleStartCall('voice')} className="w-10 h-10 flex items-center justify-center rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-400 transition-colors">
                  <span className="material-symbols-rounded">call</span>
                </button>
                <button onClick={() => handleStartCall('video')} className="w-10 h-10 flex items-center justify-center rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-400 transition-colors scale-110">
                  <span className="material-symbols-rounded">videocam</span>
                </button>
                <button className="w-10 h-10 flex items-center justify-center rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-400 transition-colors">
                  <span className="material-symbols-rounded">search</span>
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {messages.map(msg => {
                const selfId = String(user.id).replace('u', '');
                const senderId = String(msg.sender_id).replace('u', '');
                const isOwn = selfId === senderId;
                return (
                  <div key={msg.message_id} className={`flex ${isOwn ? 'justify-end' : 'justify-start'} animate-in slide-in-from-bottom-2 duration-300`}>
                    <div className={`max-w-[75%] md:max-w-md px-4 py-2.5 rounded-2xl shadow-sm text-sm relative ${isOwn ? 'bg-indigo-600 text-white rounded-tr-none' : 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-tl-none border border-slate-100 dark:border-slate-700'}`}>
                      {msg.message && <p className="whitespace-pre-wrap leading-relaxed">{msg.message}</p>}
                      <div className={`text-[9px] mt-1 flex items-center justify-end gap-1 font-bold ${isOwn ? 'text-indigo-200' : 'text-slate-400 dark:text-slate-500'}`}>
                        {new Date(msg.sent_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        {isOwn && <span className={'text-sky-300'}>✓✓</span>}
                      </div>
                    </div>
                  </div>
                );
              })}
              <div ref={chatEndRef} />
            </div>

            <div className="p-4 bg-white dark:bg-slate-800 border-t border-slate-100 dark:border-slate-700 shadow-2xl">
              <form onSubmit={handleSendMessage} className="flex gap-3 items-end max-w-4xl mx-auto">
                <div className="flex-1 relative">
                  <textarea 
                    rows={1}
                    placeholder="Type a message (MySQL Synchronized)..." 
                    className="w-full bg-slate-50 dark:bg-slate-900 rounded-2xl px-5 py-3.5 outline-none focus:ring-2 focus:ring-indigo-500/30 border border-transparent focus:border-indigo-500 transition-all text-slate-900 dark:text-white resize-none max-h-32"
                    value={inputText}
                    onChange={e => setInputText(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSendMessage();
                      }
                    }}
                  />
                </div>
                <button 
                  type="submit" 
                  disabled={!inputText.trim()}
                  className="bg-indigo-600 text-white w-12 h-12 flex items-center justify-center rounded-2xl font-bold shadow-xl shadow-indigo-100 dark:shadow-none hover:scale-105 active:scale-95 transition-all disabled:opacity-50"
                >
                  <span className="material-symbols-rounded">send</span>
                </button>
              </form>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-slate-400 dark:text-slate-600 p-8 text-center animate-page">
            <div className="w-24 h-24 bg-white dark:bg-slate-800 rounded-[2rem] flex items-center justify-center text-4xl mb-6 shadow-xl shadow-indigo-50 dark:shadow-none border border-slate-100 dark:border-slate-700 text-indigo-500">
              <span className="material-symbols-rounded text-5xl">forum</span>
            </div>
            <h3 className="text-2xl font-black text-slate-900 dark:text-white mb-2 tracking-tight">Signal Secured Chat</h3>
            <p className="font-medium max-w-xs text-sm leading-relaxed text-slate-500 dark:text-slate-400">All data flows dynamically into the active MySQL backend instance over websockets.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Messages;
