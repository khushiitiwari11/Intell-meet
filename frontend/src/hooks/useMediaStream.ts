import { useState, useEffect, useRef } from 'react';

export const useMediaStream = () => {
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);
  const isRequested = useRef(false);

  useEffect(() => {
    if (isRequested.current) return;
    isRequested.current = true;

    const getStream = async () => {
      try {
        const userStream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true,
        });
        setStream(userStream);
      } catch (err) {
        console.error("Error accessing media devices:", err);
        setError("Could not access camera or microphone.");
      }
    };

    getStream();

    // Cleanup: Stop tracks when the component unmounts
    return () => {
      stream?.getTracks().forEach(track => track.stop());
    };
  }, []);

  return { stream, error };
};