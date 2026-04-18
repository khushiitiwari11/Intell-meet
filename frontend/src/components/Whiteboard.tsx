import { useEffect, useRef, useState } from 'react';
import { X, Trash2 } from 'lucide-react';
import { Socket } from 'socket.io-client';

interface WhiteboardProps {
  socket: Socket | null;
  roomId: string;
  onClose: () => void;
}

export default function Whiteboard({ socket, roomId, onClose }: WhiteboardProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const lastPos = useRef({ x: 0, y: 0 });

  useEffect(() => {
    if (!socket) return;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    // Listen for drawings from the other person
    socket.on('draw-line', ({ x0, y0, x1, y1 }) => {
      ctx.beginPath();
      ctx.moveTo(x0, y0);
      ctx.lineTo(x1, y1);
      ctx.strokeStyle = '#3b82f6'; // Blue for remote user
      ctx.lineWidth = 3;
      ctx.lineCap = 'round';
      ctx.stroke();
      ctx.closePath();
    });

    return () => {
      socket.off('draw-line');
    };
  }, [socket]);

  const getCoordinates = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    
    // Support for both mouse and touch screens
    let clientX, clientY;
    if ('touches' in e) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = (e as React.MouseEvent).clientX;
      clientY = (e as React.MouseEvent).clientY;
    }
    
    return {
      x: clientX - rect.left,
      y: clientY - rect.top
    };
  };

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    setIsDrawing(true);
    lastPos.current = getCoordinates(e);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    const currentPos = getCoordinates(e);

    // Draw locally
    ctx.beginPath();
    ctx.moveTo(lastPos.current.x, lastPos.current.y);
    ctx.lineTo(currentPos.x, currentPos.y);
    ctx.strokeStyle = '#ef4444'; // Red for you
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.stroke();
    ctx.closePath();

    // Broadcast to the room
    socket?.emit('draw-line', {
      roomId,
      x0: lastPos.current.x,
      y0: lastPos.current.y,
      x1: currentPos.x,
      y1: currentPos.y
    });

    lastPos.current = currentPos;
  };

  const stopDrawing = () => setIsDrawing(false);

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (canvas && ctx) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
  };

  return (
    <div className="absolute inset-0 z-40 bg-white/10 backdrop-blur-sm flex items-center justify-center p-8 animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl w-full h-full max-w-5xl flex flex-col overflow-hidden border border-gray-200">
        
        {/* Whiteboard Header */}
        <div className="p-4 bg-gray-50 border-b border-gray-200 flex justify-between items-center">
          <h2 className="font-bold text-gray-800">Collaborative Whiteboard</h2>
          <div className="flex gap-4">
            <button onClick={clearCanvas} className="text-gray-500 hover:text-red-500 flex items-center gap-1 text-sm font-medium">
              <Trash2 size={16} /> Clear
            </button>
            <button type="button" title="Close whiteboard" onClick={onClose} className="text-gray-500 hover:text-gray-800 bg-gray-200 rounded-full p-1">
              <X size={20} />
            </button>
          </div>
        </div>

        {/* The Drawing Canvas */}
        <div className="flex-1 bg-white relative cursor-crosshair">
          <canvas
            ref={canvasRef}
            width={1000} // High resolution width
            height={600} // High resolution height
            className="w-full h-full absolute inset-0 touch-none"
            onMouseDown={startDrawing}
            onMouseMove={draw}
            onMouseUp={stopDrawing}
            onMouseOut={stopDrawing}
            onTouchStart={startDrawing}
            onTouchMove={draw}
            onTouchEnd={stopDrawing}
          />
        </div>
      </div>
    </div>
  );
}