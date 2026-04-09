import React from 'react';
import VideoCall from './VideoCall';

interface CallOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  receiverId?: string | number;
  receiverName?: string;
  receiverAvatar?: string;
  mode: 'voice' | 'video';
  isIncoming?: boolean;
  incomingOffer?: any;
}

const CallOverlay: React.FC<CallOverlayProps> = ({ isOpen, onClose, receiverId, receiverName, receiverAvatar, mode, isIncoming, incomingOffer }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      {/* Glassmorphic Backdrop */}
      <div 
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-xl transition-all"
        onClick={onClose}
      />
      
      {/* Call Window */}
      <div className="relative z-10 w-full max-w-4xl p-8 bg-white/10 dark:bg-slate-900/50 backdrop-blur-2xl border border-white/20 dark:border-slate-700/50 rounded-[3rem] shadow-2xl shadow-indigo-500/20 flex flex-col items-center animate-in zoom-in-95 duration-300">
        
        {/* Header Ribbon */}
        <div className="w-full flex justify-between items-center mb-6">
          <div className="bg-white/20 px-4 py-1.5 rounded-full border border-white/10 flex items-center gap-2 text-white">
            <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
            <span className="text-xs font-black uppercase tracking-widest">
              {isIncoming ? (mode === 'video' ? 'Incoming Video Call' : 'Incoming Voice Call') : (mode === 'video' ? 'Secure Video Session' : 'Secure Voice Session')}
            </span>
          </div>
          <button 
            onClick={onClose}
            className="w-10 h-10 rounded-full bg-white/10 hover:bg-red-500/80 text-white flex items-center justify-center transition-all backdrop-blur-md border border-white/20 hover:border-red-400"
          >
            <span className="material-symbols-rounded">close</span>
          </button>
        </div>

        <div className="w-full relative rounded-[2rem] overflow-hidden bg-slate-950/80 aspect-video shadow-inner flex items-center justify-center border border-white/10">
          <VideoCall 
            receiverId={receiverId} 
            receiverName={receiverName}
            receiverAvatar={receiverAvatar}
            onHangup={onClose} 
            mode={mode} 
            isIncoming={isIncoming}
            incomingOffer={incomingOffer}
          />
        </div>

        {/* Control Bar */}
        <div className="mt-8 flex items-center justify-center gap-6">
          <button className="w-14 h-14 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-white flex items-center justify-center text-xl hover:bg-white/20 transition-all hover:scale-110">
            <span className="material-symbols-rounded">mic</span>
          </button>
          <button 
            onClick={onClose}
            className="w-16 h-16 rounded-full bg-red-500 text-white flex items-center justify-center text-2xl hover:bg-red-600 transition-all shadow-lg shadow-red-500/30 hover:scale-110"
          >
            <span className="material-symbols-rounded text-3xl">call_end</span>
          </button>
          <button className="w-14 h-14 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-white flex items-center justify-center text-xl hover:bg-white/20 transition-all hover:scale-110">
            <span className="material-symbols-rounded">videocam</span>
          </button>
        </div>

      </div>
    </div>
  );
};

export default CallOverlay;
