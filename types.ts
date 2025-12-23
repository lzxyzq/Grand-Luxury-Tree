export enum HandGestureState {
  CLOSED = 'CLOSED', // Neutral/Relaxed Hand -> Form Tree
  OPEN = 'OPEN',     // Hand Open -> Explode Stars
  PINCH = 'PINCH',   // OK Gesture (Thumb+Index touching) -> Zoom Photo
}

export interface ThemeConfig {
  id: string;
  name: string;
  primary: string;
  secondary: string;
  glow: string;
  background: string;
  light: string;
}

export interface AppState {
  isCameraReady: boolean;
  permissionGranted: boolean;
  gesture: HandGestureState;
  loading: boolean;
  error: string | null;
  theme: ThemeConfig;
  photos: UserPhoto[];
}

export interface UserPhoto {
  id: string;
  url: string;
  position: [number, number, number];
  rotation: [number, number, number];
  aspectRatio: number;
}

export interface ParticleData {
  initialPos: [number, number, number];
  targetPos: [number, number, number];
  size: number;
  speed: number;
}

export interface HandTrackingData {
  x: number; // Normalized 0-1 (Screen X)
  y: number; // Normalized 0-1 (Screen Y)
  z: number; // Proxy for depth/scale (0 = far, 1 = close)
  present: boolean;
}

declare global {
  namespace JSX {
    interface IntrinsicElements {
      div: any;
      h1: any;
      h2: any;
      p: any;
      span: any;
      button: any;
      input: any;
      video: any;
      svg: any;
      path: any;
      audio: any;
      // React Three Fiber elements
      ambientLight: any;
      pointLight: any;
      spotLight: any;
      color: any;
      points: any;
      bufferGeometry: any;
      bufferAttribute: any;
      pointsMaterial: any;
      group: any;
      mesh: any;
      planeGeometry: any;
      meshStandardMaterial: any;
      meshBasicMaterial: any;
      meshPhysicalMaterial: any;
    }
  }
}