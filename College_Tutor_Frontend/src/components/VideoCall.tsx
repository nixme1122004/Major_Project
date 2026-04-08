import React, { useRef, useState } from "react";
import { io, Socket } from "socket.io-client";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:5000";

let socket: Socket;

const VideoCall: React.FC = () => {
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);

  const [roomId, setRoomId] = useState<number | null>(null);
  const [pc, setPc] = useState<RTCPeerConnection | null>(null);

  const token = localStorage.getItem("skillswap_auth") ? JSON.parse(localStorage.getItem("skillswap_auth")!).token : null;

  const startCall = async () => {
    try {
      const res = await fetch(`${BACKEND_URL}/api/video-call/start-auto`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          receiver_id: 13 
        })
      });

      const data = await res.json();
      const room_id = data.room_id;
      setRoomId(room_id);

      socket = io(BACKEND_URL, {
        auth: { token }
      });

      socket.emit("join-room", room_id);

      const peer = new RTCPeerConnection();
      setPc(peer);

      peer.ontrack = (event) => {
        if (remoteVideoRef.current) {
          remoteVideoRef.current.srcObject = event.streams[0];
        }
      };

      peer.onicecandidate = (event) => {
        if (event.candidate) {
          socket.emit("webrtc-ice-candidate", {
            roomId: room_id,
            candidate: event.candidate
          });
        }
      };

      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true
      });

      stream.getTracks().forEach(track => peer.addTrack(track, stream));

      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }

      socket.on("webrtc-offer", async (offer) => {
        await peer.setRemoteDescription(offer);
        const answer = await peer.createAnswer();
        await peer.setLocalDescription(answer);

        socket.emit("webrtc-answer", {
          roomId: room_id,
          answer
        });
      });

      socket.on("webrtc-answer", async (answer) => {
        await peer.setRemoteDescription(answer);
      });

      socket.on("webrtc-ice-candidate", async (candidate) => {
        await peer.addIceCandidate(candidate);
      });

      const offer = await peer.createOffer();
      await peer.setLocalDescription(offer);

      socket.emit("webrtc-offer", {
        roomId: room_id,
        offer
      });
    } catch (err) {
      console.error("Video call failed:", err);
    }
  };

  return (
    <div className="p-6 bg-white dark:bg-slate-800 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-700">
      <h2 className="text-xl font-extrabold text-slate-900 dark:text-white tracking-tight mb-4">College Tutor Video Call</h2>

      <button onClick={startCall} className="px-6 py-2 bg-indigo-600 text-white text-sm font-bold rounded-xl shadow-md hover:bg-indigo-700 transition-all mb-6">
        Start Call
      </button>

      <div className="flex flex-wrap gap-4">
        <video ref={localVideoRef} autoPlay muted className="w-[300px] h-[200px] bg-slate-900 rounded-2xl object-cover mirror" />
        <video ref={remoteVideoRef} autoPlay className="w-[300px] h-[200px] bg-slate-900 rounded-2xl object-cover" />
      </div>

      {roomId && <p className="mt-4 text-sm font-bold text-slate-500">Room ID: {roomId}</p>}
    </div>
  );
};

export default VideoCall;
