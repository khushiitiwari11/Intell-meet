import { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Mic, MicOff, Video as VideoIcon, VideoOff, PhoneOff } from 'lucide-react';
import { io, Socket } from 'socket.io-client';
import toast from 'react-hot-toast';
import { useAuthStore } from '../store/useAuthStore';

// Google's free public STUN servers help browsers find their public IP addresses
const ICE_SERVERS = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
  ],
};

export default function MeetingRoom() {
  const { id: roomId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  
  // Video Elements
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  
  // State
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [remoteConnected, setRemoteConnected] = useState(false);

  // Networking Refs (so they persist without triggering re-renders)
  const socketRef = useRef<Socket | null>(null);
  const peerRef = useRef<RTCPeerConnection | null>(null);

  useEffect(() => {
    // 1. Connect to our backend Socket server
    socketRef.current = io('http://localhost:5001');
    const socket = socketRef.current;

    // 2. Request Camera and Microphone
    navigator.mediaDevices.getUserMedia({ video: true, audio: true })
      .then((stream) => {
        setLocalStream(stream);
        if (localVideoRef.current) localVideoRef.current.srcObject = stream;

        // 3. Join the Socket Room
        socket.emit('join-room', roomId, user?.id);

        // 4. Initialize the WebRTC Peer Connection
        const peer = new RTCPeerConnection(ICE_SERVERS);
        peerRef.current = peer;

        // Add our local video/audio tracks to the connection
        stream.getTracks().forEach(track => peer.addTrack(track, stream));

        // When the peer sends their video, attach it to the remote video element
        peer.ontrack = (event) => {
          if (remoteVideoRef.current) {
            remoteVideoRef.current.srcObject = event.streams[0];
            setRemoteConnected(true);
          }
        };

        // When we find a networking path (ICE Candidate), send it to the other user
        peer.onicecandidate = (event) => {
          if (event.candidate) {
            socket.emit('ice-candidate', { target: roomId, candidate: event.candidate });
          }
        };

        // --- SIGNALING LOGIC ---

        // A new user joined! We need to call them (Create Offer)
        socket.on('user-connected', async (newUserId) => {
          toast.success('Another user joined the room!');
          const offer = await peer.createOffer();
          await peer.setLocalDescription(offer);
          socket.emit('offer', { target: roomId, caller: user?.id, sdp: offer });
        });

        // Someone is calling us! We need to answer (Receive Offer -> Create Answer)
        socket.on('offer', async (payload) => {
          // Ignore our own offers
          if (payload.caller === user?.id) return; 
          
          await peer.setRemoteDescription(new RTCSessionDescription(payload.sdp));
          const answer = await peer.createAnswer();
          await peer.setLocalDescription(answer);
          socket.emit('answer', { target: roomId, responder: user?.id, sdp: answer });
        });

        // The other person answered! Finalize the connection
        socket.on('answer', async (payload) => {
          if (payload.responder === user?.id) return;
          await peer.setRemoteDescription(new RTCSessionDescription(payload.sdp));
        });

        // Receive their networking path and add it to our connection
        socket.on('ice-candidate', async (candidate) => {
          try {
            await peer.addIceCandidate(new RTCIceCandidate(candidate));
          } catch (e) {
            console.error('Error adding ICE candidate', e);
          }
        });

        socket.on('user-disconnected', () => {
          toast('User left the room', { icon: '👋' });
          if (remoteVideoRef.current) remoteVideoRef.current.srcObject = null;
          setRemoteConnected(false);
        });
      })
      .catch((error) => {
        console.error('Media access error:', error);
        toast.error('Could not access camera/microphone.');
      });

    // Cleanup: Disconnect sockets and stop camera when leaving the page
    return () => {
      localStream?.getTracks().forEach(track => track.stop());
      peerRef.current?.close();
      socket.disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomId]);

  // --- CONTROLS ---
  const toggleAudio = () => {
    if (localStream) {
      const audioTrack = localStream.getAudioTracks()[0];
      audioTrack.enabled = !audioTrack.enabled;
      setIsMuted(!audioTrack.enabled);
    }
  };

  const toggleVideo = () => {
    if (localStream) {
      const videoTrack = localStream.getVideoTracks()[0];
      videoTrack.enabled = !videoTrack.enabled;
      setIsVideoOff(!videoTrack.enabled);
    }
  };

  const leaveMeeting = () => {
    navigate('/dashboard');
  };

  return (
    <div className="h-screen bg-gray-900 flex flex-col font-sans">
      {/* Header */}
      <div className="p-4 flex justify-between items-center bg-gray-800 text-white shadow-md z-10">
        <h1 className="text-xl font-bold flex items-center gap-2">
          <VideoIcon size={24} className="text-blue-500" /> IntellMeet
        </h1>
        <span className="bg-gray-700 px-3 py-1 rounded-md text-sm font-mono text-gray-300">
          Room ID: {roomId}
        </span>
      </div>

      {/* Video Grid */}
      <div className="flex-1 p-4 flex flex-col md:flex-row items-center justify-center gap-4 relative">
        
        {/* Remote Video (The other person) */}
        <div className={`relative w-full max-w-4xl aspect-video bg-black rounded-2xl overflow-hidden shadow-2xl border border-gray-700 ${!remoteConnected && 'hidden'}`}>
          <video ref={remoteVideoRef} autoPlay playsInline className="w-full h-full object-cover" />
          <div className="absolute bottom-4 left-4 bg-black/60 px-3 py-1 rounded-lg text-white backdrop-blur-sm text-sm">
            Guest
          </div>
        </div>

        {/* Local Video (You) */}
        <div className={`relative bg-black rounded-2xl overflow-hidden shadow-2xl border border-gray-700 transition-all duration-300 ${remoteConnected ? 'w-48 aspect-video absolute bottom-24 right-8' : 'w-full max-w-4xl aspect-video'}`}>
          <video 
            ref={localVideoRef} 
            autoPlay 
            playsInline 
            muted // ALWAYS mute local video to prevent horrible echo loops
            className={`w-full h-full object-cover ${isVideoOff ? 'hidden' : 'block'}`} 
            style={{ transform: 'scaleX(-1)' }} // Mirror the camera like Zoom does
          />
          {isVideoOff && (
            <div className="absolute inset-0 flex items-center justify-center text-white bg-gray-800">
              <span className="text-xl font-medium">Camera Off</span>
            </div>
          )}
          <div className="absolute bottom-2 left-2 bg-black/60 px-2 py-1 rounded-md text-white backdrop-blur-sm text-xs">
            You
          </div>
        </div>

        {/* Waiting State */}
        {!remoteConnected && (
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <div className="bg-gray-800/80 backdrop-blur-md px-6 py-4 rounded-xl text-center border border-gray-700">
              <h3 className="text-white text-xl font-semibold mb-2">Waiting for others to join...</h3>
              <p className="text-gray-400 text-sm">Share the Room ID from the top right corner.</p>
            </div>
          </div>
        )}
      </div>

      {/* Control Bar */}
      <div className="h-20 bg-gray-800 flex items-center justify-center space-x-6 pb-2">
        <button onClick={toggleAudio} className={`p-4 rounded-full transition ${isMuted ? 'bg-red-500 hover:bg-red-600' : 'bg-gray-700 hover:bg-gray-600'} text-white shadow-lg`}>
          {isMuted ? <MicOff size={24} /> : <Mic size={24} />}
        </button>

        <button onClick={toggleVideo} className={`p-4 rounded-full transition ${isVideoOff ? 'bg-red-500 hover:bg-red-600' : 'bg-gray-700 hover:bg-gray-600'} text-white shadow-lg`}>
          {isVideoOff ? <VideoOff size={24} /> : <VideoIcon size={24} />}
        </button>

        <button onClick={leaveMeeting} className="p-4 rounded-full bg-red-600 hover:bg-red-700 text-white transition shadow-lg flex items-center justify-center" title="End Call">
          <PhoneOff size={24} />
        </button>
      </div>
    </div>
  );
}