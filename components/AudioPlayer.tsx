import React, { useEffect, useRef } from 'react';

// Fix for missing HTML audio element
declare global {
  namespace JSX {
    interface IntrinsicElements {
      audio: any;
    }
  }
}

interface AudioPlayerProps {
  playing: boolean;
  muted: boolean;
}

export const AudioPlayer: React.FC<AudioPlayerProps> = ({ playing, muted }) => {
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    if (playing) {
      audioRef.current?.play().catch(e => console.log("Audio play failed (waiting for interaction):", e));
    } else {
      audioRef.current?.pause();
    }
  }, [playing]);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.muted = muted;
    }
  }, [muted]);

  return (
    <audio
      ref={audioRef}
      loop
      preload="auto"
      // Jingle Bells - Kevin MacLeod (Creative Commons)
      // Replaced previous track with this upbeat festive alternative.
      src="https://upload.wikimedia.org/wikipedia/commons/transcoded/c/c2/Jingle_Bells_-_Kevin_MacLeod.ogg/Jingle_Bells_-_Kevin_MacLeod.ogg.mp3"
    />
  );
};