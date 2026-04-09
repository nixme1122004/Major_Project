import React, { useRef, useState, useEffect, useCallback } from "react";
import { Socket } from "socket.io-client";
import { socketService } from "../services/socket";

interface VideoCallProps {
  receiverId?: string | number;
  receiverName?: string;
  receiverAvatar?: string;
  onHangup: () => void;
  mode: 'voice' | 'video';
  isIncoming?: boolean;
  incomingOffer?: any;
}

const STUN_SERVERS = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" },
    { urls: "stun:stun2.l.google.com:19302" },
  ],
};

const VideoCall: React.FC<VideoCallProps> = ({ 
  receiverId, 
  receiverName, 
  receiverAvatar, 
  onHangup, 
  mode, 
  isIncoming, 
  incomingOffer 
}) => {
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const socketRef = useRef<Socket | null>(null);

  const [callStatus, setCallStatus] = useState<'idle' | 'calling' | 'ringing' | 'connected' | 'ended'>('idle');
  const statusRef = useRef(callStatus);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    statusRef.current = callStatus;
  }, [callStatus]);

  const cleanup = useCallback(() => {
    console.log("🛠️ Cleaning up WebRTC Session...");
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => track.stop());
    }
    if (pcRef.current) {
      pcRef.current.close();
      pcRef.current = null;
    }
    if (socketRef.current) {
      // 🛡️ Guard: Only emit hangup if this tab actually had an active call attempt
      // We don't want secondary tabs to kill calls when they close their "Ringing" overlay
      if (statusRef.current === 'connected' || statusRef.current === 'calling') {
        console.log("📵 Emitting hangup to:", receiverId, "from status:", statusRef.current);
        socketRef.current.emit('hangup', { to: receiverId });
      } else {
        console.log("🤫 Silent cleanup (not an active call):", statusRef.current);
      }
      
      socketRef.current.off('call-answered');
      socketRef.current.off('ice-candidate');
      socketRef.current.off('call-ended');
    }
  }, [receiverId]);

  const createPeerConnection = useCallback((socket: Socket) => {
    console.log("🌐 Creating Peer Connection...");
    const pc = new RTCPeerConnection(STUN_SERVERS);

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        console.log("🧊 ICE Candidate found, sending...");
        socket.emit("ice-candidate", {
          to: receiverId,
          candidate: event.candidate
        });
      }
    };

    pc.ontrack = (event) => {
      console.log("📡 Received remote track:", event.streams[0]);
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = event.streams[0];
      }
      setCallStatus('connected');
    };

    pc.onconnectionstatechange = () => {
      console.log("📊 connectionState change:", pc.connectionState);
      if (pc.connectionState === 'disconnected' || pc.connectionState === 'failed') {
        console.error("❌ WebRTC Connection Failed");
      }
    };

    pcRef.current = pc;
    return pc;
  }, [receiverId]);

  const startMedia = async () => {
    console.log("📸 Accessing Media Devices...");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: mode === 'video',
        audio: true
      });
      localStreamRef.current = stream;
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }
      return stream;
    } catch (err: any) {
      console.error("Media access failed:", err);
      if (err.name === 'NotAllowedError') {
        setError("Camera/Microphone permission denied. Enable it in your browser settings.");
      } else {
        setError(`Media Error: ${err.message || "Could not access hardware"}`);
      }
      return null;
    }
  };

  const initiateCall = async () => {
    if (!receiverId) return;
    const socket = socketService.getSocket();
    if (!socket) {
      setError("Not connected to server. Please refresh.");
      return;
    }
    socketRef.current = socket;

    setCallStatus('calling');
    const pc = createPeerConnection(socket);
    const stream = await startMedia();

    if (!stream) {
      console.warn("⚠️ Continuing without local stream due to error");
    } else {
      stream.getTracks().forEach(track => pc.addTrack(track, stream));
    }

    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);

    const authState = JSON.parse(localStorage.getItem('skillswap_auth') || '{}');
    console.log("📞 Sending Call Offer...");
    socket.emit('call-user', {
      to: receiverId,
      callerName: authState.user?.name || 'Peer',
      callerAvatar: authState.user?.avatar || '',
      offer,
      mode
    });

    socket.on('call-answered', async (data) => {
      console.log("👂 Call Answer Received!");
      await pc.setRemoteDescription(new RTCSessionDescription(data.answer));
    });

    socket.on('ice-candidate', async (data) => {
      try {
        await pc.addIceCandidate(new RTCIceCandidate(data.candidate));
      } catch (e) {
        console.error("Error adding ice candidate:", e);
      }
    });

    socket.on('call-ended', () => {
      console.log("📵 Remote peer hung up");
      onHangup();
    });
  };

  const acceptCall = async () => {
    if (!receiverId || !incomingOffer) return;
    const socket = socketService.getSocket();
    if (!socket) {
      setError("Not connected to server.");
      return;
    }
    socketRef.current = socket;

    setCallStatus('connected');
    const pc = createPeerConnection(socket);
    const stream = await startMedia();

    if (!stream) {
      console.warn("⚠️ Accepting without local media stream");
    } else {
      stream.getTracks().forEach(track => pc.addTrack(track, stream));
    }

    await pc.setRemoteDescription(new RTCSessionDescription(incomingOffer));
    const answer = await pc.createAnswer();
    await pc.setLocalDescription(answer);

    console.log("✅ Sending Call Answer...");
    socket.emit('answer-call', {
      to: receiverId,
      answer
    });

    socket.on('ice-candidate', async (data) => {
      try {
        await pc.addIceCandidate(new RTCIceCandidate(data.candidate));
      } catch (e) {
        console.error("Error adding ice candidate:", e);
      }
    });

    socket.on('call-ended', () => {
      console.log("📵 Remote peer hung up");
      onHangup();
    });
  };

  useEffect(() => {
    if (isIncoming) {
      setCallStatus('ringing');
    } else {
      initiateCall();
    }

    return () => cleanup();
  }, []);

  return (
    <div className="w-full h-full flex flex-col items-center justify-center p-4 relative bg-slate-900 overflow-hidden">
      {/* Remote Video (Full Background) */}
      <video 
        ref={remoteVideoRef} 
        autoPlay 
        playsInline
        className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 ${callStatus === 'connected' ? 'opacity-100' : 'opacity-0'}`}
      />

      {/* Local Video (Floating) */}
      <div className={`absolute top-4 right-4 w-32 md:w-48 aspect-video bg-black rounded-2xl overflow-hidden shadow-2xl border-2 border-white/20 z-20 transition-transform duration-500 ${callStatus === 'connected' ? 'scale-100' : 'scale-0'}`}>
        <video 
          ref={localVideoRef} 
          autoPlay 
          muted 
          playsInline
          className="w-full h-full object-cover" 
        />
      </div>

      {/* Overlay Content */}
      <div className="relative z-10 flex flex-col items-center text-center">
        {callStatus === 'ringing' && (
          <div className="animate-in zoom-in duration-300">
            <div className="w-24 h-24 bg-indigo-600 rounded-full flex items-center justify-center mb-6 shadow-2xl relative">
              <div className="absolute inset-0 bg-indigo-600 rounded-full animate-ping opacity-20"></div>
              <img src={receiverAvatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${receiverName}`} className="w-22 h-22 rounded-full object-cover" alt="" />
            </div>
            <h2 className="text-2xl font-black text-white mb-2">{receiverName} is Calling</h2>
            <p className="text-indigo-300 font-bold uppercase tracking-widest text-xs mb-8">Incoming {mode === 'video' ? 'Video' : 'Voice'} Connection</p>
            <div className="flex gap-4">
              <button 
                onClick={acceptCall}
                className="px-8 py-3 bg-green-500 text-white font-black rounded-2xl shadow-xl hover:bg-green-600 active:scale-95 transition-all flex items-center gap-2"
              >
                <span className="material-symbols-rounded">call</span>
                Accept
              </button>
              <button 
                onClick={onHangup}
                className="px-8 py-3 bg-red-500 text-white font-black rounded-2xl shadow-xl hover:bg-red-600 active:scale-95 transition-all flex items-center gap-2"
              >
                <span className="material-symbols-rounded">call_end</span>
                Decline
              </button>
            </div>
          </div>
        )}

        {callStatus === 'calling' && (
          <div className="flex flex-col items-center">
            <div className="w-20 h-20 bg-white/10 backdrop-blur-md rounded-full flex items-center justify-center mb-6 border border-white/20 animate-pulse">
              <span className="material-symbols-rounded text-white text-3xl">wifi_calling_3</span>
            </div>
            <h2 className="text-xl font-bold text-white mb-1">Calling {receiverName}...</h2>
            <p className="text-white/40 text-xs font-black uppercase tracking-widest">Establishing Secure Channel</p>
          </div>
        )}

        {error && (
          <div className="p-6 bg-red-500/20 backdrop-blur-md border border-red-500/50 rounded-2xl max-w-xs">
            <span className="material-symbols-rounded text-red-400 mb-2">warning</span>
            <p className="text-white text-sm font-bold">{error}</p>
            <div className="flex gap-2 justify-center mt-4">
              <button onClick={() => window.location.reload()} className="px-4 py-2 bg-white/20 hover:bg-white/30 text-white text-xs font-bold rounded-xl transition-all">Retry Refresh</button>
              <button onClick={onHangup} className="px-4 py-2 bg-red-500 text-white text-xs font-bold rounded-xl transition-all">Close</button>
            </div>
          </div>
        )}

        {callStatus === 'idle' && !error && (
          <div className="flex flex-col items-center">
             <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center animate-spin mb-4">
                <span className="material-symbols-rounded text-white opacity-20">autorenew</span>
             </div>
             <p className="text-white/40 text-[10px] font-black uppercase tracking-widest">Preparing Audio/Video</p>
          </div>
        )}
      </div>

      {mode === 'voice' && callStatus === 'connected' && (
        <div className="flex flex-col items-center">
           <div className="w-32 h-32 bg-indigo-600/20 rounded-full flex items-center justify-center animate-pulse border-4 border-indigo-500/30">
              <span className="material-symbols-rounded text-6xl text-indigo-500">mic</span>
           </div>
           <p className="text-indigo-400 font-black uppercase tracking-[0.2em] text-xs mt-6">Audio Stream Encrypted</p>
        </div>
      )}
    </div>
  );
};

export default VideoCall;
