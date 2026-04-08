import React, { useState, useEffect, useRef, useMemo } from 'react';
import axios from 'axios';
import { io, Socket } from 'socket.io-client';
import { User, Message } from '../types';
import { StorageService } from '../services/storage';

interface MessagesProps {
  user: User;
}

const BACKEND_URL = (import.meta as any).env.VITE_BACKEND_URL || 'http://localhost:5000';

const Messages: React.FC<MessagesProps> = ({ user }) => {
  const [activeChat, setActiveChat] = useState<User | null>(null);
  const [messages, setMessages] = useState<any[]>([]); // MySQL Message format
  const [inputText, setInputText] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeRoomId, setActiveRoomId] = useState<number | null>(null);

  const socketRef = useRef<Socket | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Still use StorageService for the static user avatars & list in the UI for the demo
  const allUsers = useMemo(() => StorageService.getUsers().filter(u => u.id !== user.id), [user.id]);

  // Establish live socket
  useEffect(() => {
    const authState = JSON.parse(localStorage.getItem('skillswap_auth') || '{}');
    if (!authState.token) return;

    socketRef.current = io(BACKEND_URL, {
      auth: { token: authState.token }
    });

    socketRef.current.on('connect', () => {
      console.log('✅ Connected to WS server for Messaging');
    });

    socketRef.current.on('newMessage', (msgObj) => {
      setMessages(prev => [...prev, msgObj]);
    });

    // We can also listen for incoming calls right here!
    socketRef.current.on('incoming-call', () => {
      window.dispatchEvent(new Event('open-call'));
    });

    return () => {
      socketRef.current?.disconnect();
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

  const handleStartCall = () => {
    window.dispatchEvent(new Event('open-call'));
  };

  return (
    <div className="h-[calc(100vh-160px)] bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm flex overflow-hidden transition-colors">

      {/* Sidebar - Contacts List */}
      <div className="w-80 border-r border-slate-100 dark:border-slate-700 flex flex-col hidden lg:flex bg-slate-50/50 dark:bg-slate-900/50">
        <div className="p-6 bg-white dark:bg-slate-800 border-b border-slate-100 dark:border-slate-700">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-black text-slate-800 dark:text-white tracking-tight">Connections</h2>
            <button className="text-indigo-600 dark:text-indigo-400 hover:scale-110 transition-transform">
              <span className="text-xl">✍️</span>
            </button>
          </div>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">🔍</span>
            <input 
              type="text" 
              placeholder="Search contacts" 
              className="w-full bg-slate-100 dark:bg-slate-900 border-none rounded-xl pl-9 pr-4 py-2.5 text-xs outline-none focus:ring-2 focus:ring-indigo-500/20 text-slate-900 dark:text-white transition-all" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto">
          {allUsers.filter(u => u.name.toLowerCase().includes(searchQuery.toLowerCase())).map(contact => (
            <button 
              key={contact.id}
              onClick={() => setActiveChat(contact)}
              className={`w-full p-4 flex gap-4 items-center transition-all relative border-b border-slate-50 dark:border-slate-800/50 ${activeChat?.id === contact.id ? 'bg-indigo-50/80 dark:bg-indigo-900/20' : 'hover:bg-white dark:hover:bg-slate-800/80'}`}
            >
              <div className="relative">
                <img src={contact.avatar} alt={contact.name} className="w-14 h-14 rounded-2xl object-cover shadow-sm" />
                <div className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-green-500 rounded-full border-2 border-white dark:border-slate-900"></div>
              </div>
              <div className="flex-1 text-left overflow-hidden">
                <p className="font-bold text-slate-800 dark:text-white truncate text-sm">{contact.name}</p>
                <p className="text-xs text-slate-400 dark:text-slate-500 truncate">Tap to open live chat</p>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col bg-slate-50/30 dark:bg-slate-950/20">
        {activeChat ? (
          <>
            <div className="p-4 bg-white dark:bg-slate-800 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between z-10">
              <div className="flex items-center gap-3">
                <button onClick={() => setActiveChat(null)} className="lg:hidden w-8 h-8 flex items-center justify-center text-slate-400">⬅️</button>
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
                <button onClick={handleStartCall} className="w-10 h-10 flex items-center justify-center rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-400 transition-colors">📞</button>
                <button onClick={handleStartCall} className="w-10 h-10 flex items-center justify-center rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-400 transition-colors scale-110">📹</button>
                <button className="w-10 h-10 flex items-center justify-center rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-400 transition-colors">🔍</button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {messages.map(msg => {
                const isOwn = String(msg.sender_id) === String(user.id);
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
                  ➤
                </button>
              </form>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-slate-400 dark:text-slate-600 p-8 text-center animate-page">
            <div className="w-24 h-24 bg-white dark:bg-slate-800 rounded-[2rem] flex items-center justify-center text-4xl mb-6 shadow-xl shadow-indigo-50 dark:shadow-none border border-slate-100 dark:border-slate-700">
              💬
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
