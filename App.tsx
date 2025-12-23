import React, { useState, useCallback, useRef } from 'react';
import { Experience } from './components/Experience';
import { HandTracker } from './components/HandTracker';
import { UIOverlay } from './components/UIOverlay';
import { AudioPlayer } from './components/AudioPlayer';
import { AppState, HandGestureState, HandTrackingData, UserPhoto } from './types';
import { THEMES } from './constants';

const App: React.FC = () => {
  const [appState, setAppState] = useState<AppState>({
    isCameraReady: false,
    permissionGranted: false,
    gesture: HandGestureState.CLOSED,
    loading: true,
    error: null,
    theme: THEMES.ICE,
    photos: [] // Store user uploaded photos
  });

  // Audio State
  const [isMuted, setIsMuted] = useState(false);
  const [audioPlaying, setAudioPlaying] = useState(false);

  const handDataRef = useRef<HandTrackingData>({
    x: 0.5,
    y: 0.5,
    z: 0.5,
    present: false
  });

  const handleGestureChange = useCallback((newGesture: HandGestureState) => {
    setAppState(prev => {
      if (prev.gesture === newGesture) return prev;
      return { ...prev, gesture: newGesture };
    });
  }, []);

  const handleCameraReady = useCallback(() => {
    setAppState(prev => ({ ...prev, isCameraReady: true, loading: false }));
  }, []);

  const handlePermissionGranted = useCallback(() => {
    setAppState(prev => ({ ...prev, permissionGranted: true }));
    setAudioPlaying(true); // Start music when user enters
  }, []);

  const handleError = useCallback((errorMsg: string) => {
    setAppState(prev => ({ ...prev, error: errorMsg, loading: false }));
  }, []);

  // Handle Image Upload
  const handlePhotoUpload = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      
      // Calculate a random position on the tree spiral
      // Similar math to particles but fixed positions
      const t = Math.random(); 
      const height = t * 10 - 5;
      const radius = (1 - t) * 4.5 + 1;
      const angle = t * 20 + Math.random() * Math.PI;
      
      const x = Math.cos(angle) * radius;
      const z = Math.sin(angle) * radius;
      
      const newPhoto: UserPhoto = {
        id: Date.now().toString(),
        url,
        position: [x, height, z],
        rotation: [0, -angle, Math.random() * 0.2 - 0.1], // Face outwards roughly
        aspectRatio: 1
      };

      setAppState(prev => ({
        ...prev,
        photos: [...prev.photos, newPhoto]
      }));
    }
  }, []);

  const toggleGesture = () => {
    setAppState(prev => {
      let next: HandGestureState;
      if (prev.gesture === HandGestureState.CLOSED) next = HandGestureState.PINCH;
      else if (prev.gesture === HandGestureState.PINCH) next = HandGestureState.OPEN;
      else next = HandGestureState.CLOSED;
      
      return { ...prev, gesture: next };
    });
    // Ensure music plays if they start via simulation toggle
    if (!audioPlaying) setAudioPlaying(true);
  };

  const toggleMute = () => setIsMuted(prev => !prev);

  return (
    <div className="relative w-full h-screen bg-black">
      <div className="absolute inset-0 z-0 transition-colors duration-1000" style={{ backgroundColor: appState.theme.background }}>
        <Experience 
          gesture={appState.gesture} 
          theme={appState.theme} 
          handDataRef={handDataRef}
          photos={appState.photos}
        />
      </div>

      <HandTracker 
        onGestureChange={handleGestureChange} 
        onCameraReady={handleCameraReady}
        onError={handleError}
        active={appState.permissionGranted}
        handDataRef={handDataRef}
      />

      <AudioPlayer playing={audioPlaying} muted={isMuted} />

      <UIOverlay 
        state={appState} 
        onStart={() => handlePermissionGranted()} 
        onToggleSimulate={toggleGesture}
        onGestureChange={handleGestureChange}
        onPhotoUpload={handlePhotoUpload}
        isMuted={isMuted}
        onToggleMute={toggleMute}
      />
    </div>
  );
};

export default App;