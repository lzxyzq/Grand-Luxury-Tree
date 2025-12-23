import React, { useRef } from 'react';
import { AppState, HandGestureState } from '../types';

interface UIOverlayProps {
  state: AppState;
  onStart: () => void;
  onToggleSimulate: () => void;
  onGestureChange: (gesture: HandGestureState) => void;
  onPhotoUpload?: (event: React.ChangeEvent<HTMLInputElement>) => void;
  isMuted: boolean;
  onToggleMute: () => void;
}

export const UIOverlay: React.FC<UIOverlayProps> = ({ 
  state, 
  onStart, 
  onToggleSimulate, 
  onPhotoUpload,
  isMuted,
  onToggleMute
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-8 z-10">
      
      {/* Header */}
      <div className="text-center mt-4">
        <h1 className="text-4xl md:text-6xl text-white font-serif tracking-widest drop-shadow-[0_0_15px_rgba(255,255,255,0.5)]">
          GRAND LUXURY
        </h1>
        <h2 className="text-xl md:text-2xl text-blue-200 font-light tracking-[0.3em] mt-2 uppercase">
          Interactive Holiday Experience
        </h2>
      </div>

      {/* Controls Container (Right Side) */}
      <div className="absolute right-8 top-1/2 -translate-y-1/2 pointer-events-auto z-20 flex flex-col items-center gap-6">
         
         {/* Mute Button */}
         <button 
           onClick={onToggleMute}
           className="group flex items-center justify-center w-12 h-12 rounded-full border border-white/20 bg-black/40 backdrop-blur-md hover:bg-white/10 transition-all duration-300"
           title={isMuted ? "Unmute" : "Mute"}
         >
           {isMuted ? (
             <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-gray-400 group-hover:text-white">
               <path strokeLinecap="round" strokeLinejoin="round" d="M17.25 9.75 19.5 12m0 0 2.25 2.25M19.5 12l2.25-2.25M19.5 12l-2.25 2.25m-10.5-6 4.72-4.72a.75.75 0 0 1 1.28.53v15.88a.75.75 0 0 1-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.507-1.938-1.354A9.009 9.009 0 0 1 2.25 12c0-.83.112-1.633.322-2.396C2.806 8.756 3.63 8.25 4.51 8.25H6.75Z" />
             </svg>
           ) : (
             <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-blue-200 group-hover:text-white">
               <path strokeLinecap="round" strokeLinejoin="round" d="M19.114 5.636a9 9 0 0 1 0 12.728M16.463 8.288a5.25 5.25 0 0 1 0 7.424M6.75 8.25l4.72-4.72a.75.75 0 0 1 1.28.53v15.88a.75.75 0 0 1-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.507-1.938-1.354A9.009 9.009 0 0 1 2.25 12c0-.83.112-1.633.322-2.396C2.806 8.756 3.63 8.25 4.51 8.25H6.75Z" />
             </svg>
           )}
         </button>

         {/* Upload Button */}
         <div className="flex flex-col items-center">
            <input 
              type="file" 
              accept="image/*" 
              className="hidden" 
              ref={fileInputRef} 
              onChange={onPhotoUpload}
            />
            <button 
              onClick={() => fileInputRef.current?.click()}
              className="group flex items-center justify-center w-16 h-16 rounded-full border border-white/30 bg-black/40 backdrop-blur-md hover:bg-white/10 hover:scale-110 transition-all duration-300 shadow-[0_0_15px_rgba(255,255,255,0.1)]"
              title="Add Memory"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8 text-blue-200 group-hover:text-white">
                 <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
            </button>
            <div className="mt-2 text-center">
                <span className="text-[10px] text-blue-200/50 uppercase tracking-widest">Add Photo</span>
            </div>
         </div>
      </div>

      {/* Center Action / Feedback */}
      <div className="flex flex-col items-center justify-center flex-grow">
        {!state.permissionGranted && !state.error && (
          <div className="bg-black/40 backdrop-blur-md p-8 border border-white/20 rounded-lg max-w-md text-center pointer-events-auto shadow-2xl">
            <p className="text-blue-100 mb-6 font-serif text-lg leading-relaxed">
              Experience the magic. Enable your camera to control the galaxy with your hands.
            </p>
            <button
              onClick={onStart}
              className="bg-white/10 hover:bg-white/20 text-white border border-blue-300/50 px-8 py-3 rounded-full transition-all duration-300 uppercase tracking-widest text-sm hover:scale-105 active:scale-95 shadow-[0_0_20px_rgba(68,136,255,0.3)]"
            >
              Enter Experience
            </button>
            <div className="mt-4">
               <button onClick={onToggleSimulate} className="text-xs text-gray-500 hover:text-white underline pointer-events-auto">
                 I don't have a camera / Simulate
               </button>
            </div>
          </div>
        )}

        {state.loading && state.permissionGranted && (
          <div className="text-blue-200 animate-pulse font-serif tracking-widest">
            INITIALIZING VISION ENGINE...
          </div>
        )}

        {state.error && (
          <div className="bg-red-900/50 p-4 rounded text-red-200 max-w-md text-center backdrop-blur-sm border border-red-500/30 pointer-events-auto">
            <p className="mb-2">Error: {state.error}</p>
            <button onClick={onToggleSimulate} className="text-white underline">
              Switch to Simulation Mode
            </button>
          </div>
        )}
      </div>

      {/* Footer Instructions */}
      <div className="text-center mb-4">
        <div className={`transition-opacity duration-700 ${state.isCameraReady || state.permissionGranted ? 'opacity-100' : 'opacity-0'}`}>
          <div className="inline-block bg-black/30 backdrop-blur-md px-6 py-3 rounded-full border border-white/10">
            <p className="text-blue-100 text-sm md:text-base font-light tracking-wide">
              {state.gesture === HandGestureState.CLOSED && "Status: Tree (Neutral)"}
              {state.gesture === HandGestureState.OPEN && "Status: Cosmic Expansion"}
              {state.gesture === HandGestureState.PINCH && "Status: Viewing Memory"}
            </p>
          </div>
        </div>
        
        {/* State Indicator */}
        <div className="mt-4 flex items-center justify-center space-x-2 opacity-50">
           <div 
             className={`w-2 h-2 rounded-full transition-colors duration-300 ${state.gesture === HandGestureState.OPEN ? 'shadow-[0_0_10px_currentColor]' : ''}`} 
             style={{ backgroundColor: state.gesture === HandGestureState.OPEN ? state.theme.secondary : '#4b5563' }}
           />
           <span className="text-xs text-gray-400 uppercase tracking-widest">
             {state.gesture === HandGestureState.PINCH ? 'OK Sign: View Photo' : (state.gesture === HandGestureState.OPEN ? 'Active: Galaxy' : 'Active: Tree')}
           </span>
        </div>
      </div>
    </div>
  );
};