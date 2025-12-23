import React, { useEffect, useRef } from 'react';
import { HandGestureState, HandTrackingData } from '../types';

interface Results {
  multiHandLandmarks: Array<Array<{ x: number; y: number; z: number }>>;
  image: any;
}

declare class Hands {
  constructor(config: { locateFile: (file: string) => string });
  setOptions(options: {
    maxNumHands: number;
    modelComplexity: number;
    minDetectionConfidence: number;
    minTrackingConfidence: number;
  }): void;
  onResults(callback: (results: Results) => void): void;
  send(input: { image: HTMLVideoElement }): Promise<void>;
  close(): void;
}

declare global {
  interface Window {
    Hands: typeof Hands;
  }
}

interface HandTrackerProps {
  onGestureChange: (gesture: HandGestureState) => void;
  onCameraReady: () => void;
  onError: (msg: string) => void;
  active: boolean;
  handDataRef: React.MutableRefObject<HandTrackingData>;
}

export const HandTracker: React.FC<HandTrackerProps> = ({ 
  onGestureChange, 
  onCameraReady, 
  onError,
  active,
  handDataRef
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const handsRef = useRef<Hands | null>(null);
  const animationFrameRef = useRef<number>(0);

  useEffect(() => {
    if (!active) return;

    let stream: MediaStream | null = null;

    const initMediaPipe = async () => {
      try {
        if (typeof window.Hands === 'undefined') {
          throw new Error("MediaPipe Hands library not loaded.");
        }

        const hands = new window.Hands({
          locateFile: (file: string) => {
            return `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`;
          },
        });

        hands.setOptions({
          maxNumHands: 1,
          modelComplexity: 1,
          minDetectionConfidence: 0.5,
          minTrackingConfidence: 0.5,
        });

        hands.onResults(onResults);
        handsRef.current = hands;

        if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
           stream = await navigator.mediaDevices.getUserMedia({
             video: {
               width: { ideal: 640 },
               height: { ideal: 480 },
               facingMode: "user"
             }
           });
           
           if (videoRef.current) {
             videoRef.current.srcObject = stream;
             await videoRef.current.play();
             onCameraReady();
             processVideo();
           }
        } else {
          onError("Camera not supported on this device.");
        }
      } catch (err) {
        console.error("MediaPipe/Camera Init Error:", err);
        onError("Failed to initialize camera or AI model.");
      }
    };

    const processVideo = async () => {
      if (handsRef.current && videoRef.current) {
        if (videoRef.current.readyState >= 2) {
           await handsRef.current.send({ image: videoRef.current });
        }
      }
      animationFrameRef.current = requestAnimationFrame(processVideo);
    };

    initMediaPipe();

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
      if (handsRef.current) {
        handsRef.current.close();
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active]);

  const onResults = (results: Results) => {
    if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
      const landmarks = results.multiHandLandmarks[0];
      
      const wrist = landmarks[0];
      
      // 1. Calculate Extended Fingers
      const tips = [8, 12, 16, 20];
      const bases = [5, 9, 13, 17];
      let extendedFingers = 0;
      for (let i = 0; i < 4; i++) {
        const t = landmarks[tips[i]];
        const b = landmarks[bases[i]];
        // Heuristic: If tip is significantly further from wrist than base, it's extended
        // Used 1.2 multiplier to require clear extension
        if (Math.hypot(t.x - wrist.x, t.y - wrist.y) > Math.hypot(b.x - wrist.x, b.y - wrist.y) * 1.2) {
          extendedFingers++;
        }
      }

      // Check thumb extended
      const thumbTip = landmarks[4];
      const thumbBase = landmarks[2];
      const isThumbExtended = Math.hypot(thumbTip.x - wrist.x, thumbTip.y - wrist.y) > 
                              Math.hypot(thumbBase.x - wrist.x, thumbBase.y - wrist.y) * 1.1;
      
      if (isThumbExtended) extendedFingers++;

      // 2. Calculate OK Gesture (Pinch)
      // Distance between Thumb Tip (4) and Index Tip (8)
      const indexTip = landmarks[8];
      const thumbTipActual = landmarks[4];
      const pinchDist = Math.hypot(thumbTipActual.x - indexTip.x, thumbTipActual.y - indexTip.y);
      // Threshold for touching
      const isPinching = pinchDist < 0.08;

      // Determine State Priority
      let newState = HandGestureState.CLOSED;

      if (isPinching && extendedFingers >= 2) {
        // OK Gesture: Thumb+Index touch, remaining fingers (Middle, Ring, Pinky) are extended
        // We check >= 2 to be lenient (e.g. maybe pinky isn't perfectly straight)
        newState = HandGestureState.PINCH; 
      } else if (extendedFingers >= 4) {
        // Open Hand: 4 or 5 fingers extended -> Galaxy
        newState = HandGestureState.OPEN; 
      } else {
        // Neutral: Fist, Relaxed, pointing etc -> Tree
        newState = HandGestureState.CLOSED; 
      }
      
      onGestureChange(newState);

      // Position Tracking
      const rawX = wrist.x; 
      const rawY = wrist.y;
      
      // Hand size proxy
      const indexMcp = landmarks[5];
      const handSize = Math.hypot(indexMcp.x - wrist.x, indexMcp.y - wrist.y) * 5; 
      
      handDataRef.current = {
        x: 1 - rawX, 
        y: rawY,
        z: handSize,
        present: true
      };

    } else {
      onGestureChange(HandGestureState.CLOSED);
      handDataRef.current = {
        ...handDataRef.current,
        present: false
      };
    }
  };

  return (
    <div className={`absolute bottom-4 right-4 w-48 h-36 z-50 transition-opacity duration-1000 ${active ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
       <div className="relative w-full h-full rounded-lg overflow-hidden border border-white/20 shadow-[0_0_20px_rgba(255,255,255,0.1)] bg-black/80 backdrop-blur-sm group">
          <video
            ref={videoRef}
            className="w-full h-full object-cover scale-x-[-1]" 
            playsInline
            muted
          />
          <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 pointer-events-none"></div>
          <div className="absolute top-2 left-2 text-[10px] text-blue-200/70 font-mono tracking-widest bg-black/40 px-2 py-0.5 rounded border border-blue-500/20">
            SYSTEM.VISUAL
          </div>
          <div className="absolute inset-0 border-2 border-transparent group-hover:border-blue-500/30 transition-colors duration-500 rounded-lg pointer-events-none"></div>
       </div>
    </div>
  );
};