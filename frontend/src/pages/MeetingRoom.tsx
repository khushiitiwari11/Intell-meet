import { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Mic, MicOff, Video as VideoIcon, VideoOff, PhoneOff, MonitorUp, MessageSquare, Send, X, PenTool, Disc } from 'lucide-react';
import { io, Socket } from 'socket.io-client';
import toast from 'react-hot-toast';
import { useAuthStore } from '../store/useAuthStore';
import Whiteboard from '../components/Whiteboard';

const ICE_SERVERS = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
  ],
};

interface ChatMessage {
  sender: string;
  text: string;
  time: string;
  isMe: boolean;
}

interface MeetingUser {
  _id?: string;
  id?: string;
  name?: string;
}

// Inline component to properly render dynamic remote WebRTC streams
const RemoteVideo = ({ stream, id }: { stream: MediaStream; id: string }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);
  return (
    <div className="relative w-full aspect-video bg-black rounded-2xl overflow-hidden shadow-xl border border-gray-700">
      <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />
      <div className="absolute bottom-3 left-3 bg-black/60 px-2 py-1 rounded-md text-white text-xs backdrop-blur-sm">
        Participant ({id.substring(0, 4)})
      </div>
    </div>
  );
};

export default function MeetingRoom() {
  const { id: roomId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuthStore() as { user: MeetingUser | null };
  
  // Create a guaranteed unique ID even if auth hasn't loaded yet
  const userIdRef = useRef(user?._id ?? user?.id ?? `guest-${Math.random().toString(36).substring(2, 9)}`);
  const userId = userIdRef.current;
  
  // Video & Stream State
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  
  // MULTI-PEER STATE: Track multiple connections and streams
  const peersRef = useRef<Map<string, RTCPeerConnection>>(new Map());
  const [remoteStreams, setRemoteStreams] = useState<{ id: string; stream: MediaStream }[]>([]);
  
  // Feature States
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [isWhiteboardOpen, setIsWhiteboardOpen] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  
  // Chat State
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Recording State
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<BlobPart[]>([]);

  // Networking Refs
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    const socketUrl = 'https://intell-meet.onrender.com';
    socketRef.current = io(socketUrl);
    const socket = socketRef.current;

    navigator.mediaDevices.getUserMedia({ video: true, audio: true })
      .then((stream) => {
        setLocalStream(stream);
        if (localVideoRef.current) localVideoRef.current.srcObject = stream;

        // Tell server we joined
        socket.emit('join-room', roomId, userId);

        // HELPER: Create a new peer connection for a specific user
        const createPeerConnection = (partnerId: string) => {
          const peer = new RTCPeerConnection(ICE_SERVERS);
          
          // Add our local tracks to the connection
          stream.getTracks().forEach(track => peer.addTrack(track, stream));

          // When we receive their video, add it to our UI state
          peer.ontrack = (event) => {
            setRemoteStreams(prev => {
              if (prev.some(s => s.id === partnerId)) return prev;
              return [...prev, { id: partnerId, stream: event.streams[0] }];
            });
          };

          // Handle ICE routing
          peer.onicecandidate = (event) => {
            if (event.candidate) {
              socket.emit('ice-candidate', { target: partnerId, sender: userId, candidate: event.candidate, roomId });
            }
          };

          peersRef.current.set(partnerId, peer);
          return peer;
        };

        // EVENT: A new user joined. We initiate the call (Offer)
        socket.on('user-connected', async (newUserId) => {
          if (newUserId === userId) return;
          toast.success('User joined the room!');
          
          const peer = createPeerConnection(newUserId);
          const offer = await peer.createOffer();
          await peer.setLocalDescription(offer);
          socket.emit('offer', { target: newUserId, caller: userId, sdp: offer, roomId });
        });

        // EVENT: We received a call (Offer). We answer it.
        socket.on('offer', async (payload) => {
          if (payload.target !== userId) return; // Ignore if not for us
          
          const peer = createPeerConnection(payload.caller);
          await peer.setRemoteDescription(new RTCSessionDescription(payload.sdp));
          const answer = await peer.createAnswer();
          await peer.setLocalDescription(answer);
          socket.emit('answer', { target: payload.caller, responder: userId, sdp: answer, roomId });
        });

        // EVENT: We received an answer to our call
        socket.on('answer', async (payload) => {
          if (payload.target !== userId) return;
          
          const peer = peersRef.current.get(payload.responder);
          if (peer) await peer.setRemoteDescription(new RTCSessionDescription(payload.sdp));
        });

        // EVENT: Network routing candidates
        socket.on('ice-candidate', async (payload) => {
          if (payload.target !== userId) return;
          
          const peer = peersRef.current.get(payload.sender);
          if (peer) {
            try {
              await peer.addIceCandidate(new RTCIceCandidate(payload.candidate));
            } catch (e) {
              console.error('Error adding ICE candidate', e);
            }
          }
        });

        // EVENT: Someone left
        socket.on('user-disconnected', (disconnectedUserId) => {
          toast('User left the room', { icon: '👋' });
          const peer = peersRef.current.get(disconnectedUserId);
          if (peer) {
            peer.close();
            peersRef.current.delete(disconnectedUserId);
          }
          setRemoteStreams(prev => prev.filter(s => s.id !== disconnectedUserId));
        });

        // EVENT: Chat messages
        socket.on('receive-message', (payload) => {
          setMessages(prev => [...prev, {
            sender: payload.senderName,
            text: payload.text,
            time: payload.time,
            isMe: false
          }]);
          setIsChatOpen(true); 
        });
      })
      .catch(() => toast.error('Could not access camera/microphone.'));

    return () => {
      localStream?.getTracks().forEach(track => track.stop());
      peersRef.current.forEach(peer => peer.close());
      socket.disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomId]);

  const toggleScreenShare = async () => {
    if (!isScreenSharing) {
      try {
        const screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true });
        const screenTrack = screenStream.getVideoTracks()[0];
        
        // Loop through ALL peers and update their video track to the screen share
        peersRef.current.forEach(peer => {
          const sender = peer.getSenders().find(s => s.track?.kind === 'video');
          if (sender) sender.replaceTrack(screenTrack);
        });
        
        if (localVideoRef.current) localVideoRef.current.srcObject = screenStream;
        setIsScreenSharing(true);

        screenTrack.onended = () => {
          const cameraTrack = localStream?.getVideoTracks()[0];
          peersRef.current.forEach(peer => {
            const sender = peer.getSenders().find(s => s.track?.kind === 'video');
            if (sender && cameraTrack) sender.replaceTrack(cameraTrack);
          });
          if (localVideoRef.current) localVideoRef.current.srcObject = localStream;
          setIsScreenSharing(false);
        };
      } catch {
        toast.error('Screen sharing cancelled.');
      }
    } else {
      const cameraTrack = localStream?.getVideoTracks()[0];
      peersRef.current.forEach(peer => {
        const sender = peer.getSenders().find(s => s.track?.kind === 'video');
        if (sender && cameraTrack) sender.replaceTrack(cameraTrack);
      });
      if (localVideoRef.current) localVideoRef.current.srcObject = localStream;
      setIsScreenSharing(false);
    }
  };

  const toggleRecording = async () => {
    if (isRecording) {
      mediaRecorderRef.current?.stop();
      return;
    }

    try {
      const screenStream = await navigator.mediaDevices.getDisplayMedia({ 
        video: { displaySurface: "browser" }, 
        audio: true 
      });
      
      const recorder = new MediaRecorder(screenStream);
      mediaRecorderRef.current = recorder;
      recordedChunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) recordedChunksRef.current.push(e.data);
      };

      recorder.onstop = () => {
        const blob = new Blob(recordedChunksRef.current, { type: 'video/webm' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `IntellMeet-Recording-${new Date().getTime()}.webm`;
        a.click();
        URL.revokeObjectURL(url);
        setIsRecording(false);
        toast.success('Recording saved to your computer!');
        screenStream.getTracks().forEach(track => track.stop());
      };

      recorder.start();
      setIsRecording(true);
      toast.success('Recording started!');
    } catch {
      toast.error('Recording cancelled.');
    }
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    const timeString = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    socketRef.current?.emit('send-message', {
      roomId,
      text: newMessage,
      senderName: user?.name || 'Guest',
      time: timeString
    });

    setMessages(prev => [...prev, { sender: 'You', text: newMessage, time: timeString, isMe: true }]);
    setNewMessage('');
  };

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

  return (
    <div className="h-screen bg-gray-900 flex font-sans overflow-hidden">
      {/* Main Video Area */}
      <div className={`flex-1 flex flex-col transition-all duration-300 ${isChatOpen ? 'w-full md:w-3/4' : 'w-full'}`}>
        
        {/* Header */}
        <div className="p-4 flex justify-between items-center bg-gray-800 text-white z-10 border-b border-gray-700">
          <h1 className="text-xl font-bold flex items-center gap-2">
            <VideoIcon size={24} className="text-blue-500" /> IntellMeet
          </h1>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-400">Participants: {remoteStreams.length + 1}</span>
            <span className="bg-gray-700 px-3 py-1 rounded-md text-sm font-mono text-gray-300">ID: {roomId}</span>
          </div>
        </div>

        {/* Dynamic Video Grid */}
        <div className="flex-1 p-6 overflow-y-auto">
          <div className={`grid gap-4 ${
            remoteStreams.length === 0 ? 'grid-cols-1 max-w-4xl mx-auto' : 
            remoteStreams.length === 1 ? 'grid-cols-1 md:grid-cols-2' : 
            'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'
          }`}>
            
            {/* Local Video */}
            <div className="relative w-full aspect-video bg-black rounded-2xl overflow-hidden shadow-xl border border-gray-700">
              <video 
                ref={localVideoRef} 
                autoPlay 
                playsInline 
                muted 
                className={`w-full h-full object-cover ${isVideoOff ? 'hidden' : 'block'}`} 
                style={{ transform: isScreenSharing ? 'none' : 'scaleX(-1)' }} 
              />
              {isVideoOff && <div className="absolute inset-0 flex items-center justify-center text-gray-400 bg-gray-800 font-medium">Camera Off</div>}
              <div className="absolute bottom-3 left-3 bg-black/60 px-2 py-1 rounded-md text-white text-xs backdrop-blur-sm">
                You {isScreenSharing && '(Sharing)'}
              </div>
            </div>

            {/* Remote Videos Mapping */}
            {remoteStreams.map((remoteUser) => (
              <RemoteVideo key={remoteUser.id} id={remoteUser.id} stream={remoteUser.stream} />
            ))}
          </div>
        </div>

        {/* Whiteboard Overlay */}
        {isWhiteboardOpen && (
          <Whiteboard 
            socket={socketRef.current} 
            roomId={roomId!} 
            onClose={() => setIsWhiteboardOpen(false)} 
          />
        )}

        {/* Control Bar */}
        <div className="h-20 bg-gray-800 flex items-center justify-center space-x-4 pb-2 border-t border-gray-700">
          <button onClick={toggleAudio} className={`p-4 rounded-full transition-colors ${isMuted ? 'bg-red-500 hover:bg-red-600' : 'bg-gray-700 hover:bg-gray-600'} text-white`}>
            {isMuted ? <MicOff size={22} /> : <Mic size={22} />}
          </button>
          <button onClick={toggleVideo} className={`p-4 rounded-full transition-colors ${isVideoOff ? 'bg-red-500 hover:bg-red-600' : 'bg-gray-700 hover:bg-gray-600'} text-white`}>
            {isVideoOff ? <VideoOff size={22} /> : <VideoIcon size={22} />}
          </button>
          <button onClick={toggleScreenShare} className={`p-4 rounded-full transition-colors ${isScreenSharing ? 'bg-blue-600' : 'bg-gray-700 hover:bg-gray-600'} text-white`} title="Share Screen">
            <MonitorUp size={22} />
          </button>
          <button onClick={() => setIsWhiteboardOpen(!isWhiteboardOpen)} className={`p-4 rounded-full transition-colors ${isWhiteboardOpen ? 'bg-purple-600' : 'bg-gray-700 hover:bg-gray-600'} text-white`} title="Whiteboard">
            <PenTool size={22} />
          </button>
          <button onClick={toggleRecording} className={`p-4 rounded-full transition-colors ${isRecording ? 'bg-red-600 animate-pulse' : 'bg-gray-700 hover:bg-gray-600'} text-white`} title="Record Meeting">
            <Disc size={22} />
          </button>
          <button onClick={() => setIsChatOpen(!isChatOpen)} className={`p-4 rounded-full transition-colors ${isChatOpen ? 'bg-blue-600' : 'bg-gray-700 hover:bg-gray-600'} text-white`} title="Toggle Chat">
            <MessageSquare size={22} />
          </button>
          <button onClick={() => navigate('/dashboard')} className="p-4 rounded-full bg-red-600 hover:bg-red-700 text-white shadow-lg shadow-red-900/50" title="Leave">
            <PhoneOff size={22} />
          </button>
        </div>
      </div>

      {/* Chat Sidebar */}
      {isChatOpen && (
        <div className="w-80 bg-white flex flex-col border-l border-gray-200 z-50 shadow-2xl">
          <div className="p-4 border-b border-gray-200 flex justify-between items-center bg-gray-50">
            <h2 className="font-bold text-gray-800 flex items-center gap-2">
              <MessageSquare size={18} className="text-blue-600" /> Meeting Chat
            </h2>
            <button onClick={() => setIsChatOpen(false)} className="text-gray-500 hover:text-gray-800 bg-gray-200 hover:bg-gray-300 p-1 rounded-full transition-colors">
              <X size={18} />
            </button>
          </div>
          
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50/50">
            {messages.length === 0 ? (
              <p className="text-center text-sm text-gray-400 mt-10">No messages yet. Say hello!</p>
            ) : (
              messages.map((msg, idx) => (
                <div key={idx} className={`flex flex-col ${msg.isMe ? 'items-end' : 'items-start'}`}>
                  <span className="text-[11px] text-gray-500 mb-1 font-medium">{msg.sender} • {msg.time}</span>
                  <div className={`px-4 py-2.5 rounded-2xl max-w-[85%] text-sm shadow-sm ${msg.isMe ? 'bg-blue-600 text-white rounded-br-sm' : 'bg-white border border-gray-200 text-gray-800 rounded-bl-sm'}`}>
                    {msg.text}
                  </div>
                </div>
              ))
            )}
            <div ref={chatEndRef} />
          </div>

          <form onSubmit={handleSendMessage} className="p-4 bg-white border-t border-gray-200 flex gap-2">
            <input 
              type="text" 
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Type a message..." 
              className="flex-1 border border-gray-300 rounded-full px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50"
            />
            <button
              type="submit"
              disabled={!newMessage.trim()}
              className="bg-blue-600 text-white p-2.5 rounded-full hover:bg-blue-700 disabled:opacity-50 transition-colors shadow-md"
            >
              <Send size={16} />
            </button>
          </form>
        </div>
      )}
    </div>
  );
}