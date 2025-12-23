import React, { Suspense, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera, Environment, Stars } from '@react-three/drei';
import { EffectComposer, Bloom, Vignette, Noise } from '@react-three/postprocessing';
import { LuxParticles } from './LuxParticles';
import { PhotoGallery } from './PhotoGallery';
import { HandGestureState, ThemeConfig, HandTrackingData, UserPhoto } from '../types';
import * as THREE from 'three';

interface ExperienceProps {
  gesture: HandGestureState;
  theme: ThemeConfig;
  handDataRef: React.MutableRefObject<HandTrackingData>;
  photos: UserPhoto[];
}

const CameraController: React.FC<{ 
  gesture: HandGestureState, 
  handDataRef: React.MutableRefObject<HandTrackingData> 
}> = ({ gesture, handDataRef }) => {
  const controlsRef = useRef<any>(null);
  const smoothRef = useRef({ azimuth: 0, distance: 20 });

  useFrame((state, delta) => {
    if (!controlsRef.current) return;

    // Disable interactions if Pinching (viewing photo)
    if (gesture === HandGestureState.PINCH) {
        controlsRef.current.autoRotate = false;
        // Smoothly move camera to neutral position
        const targetDist = 20;
        const currentDist = controlsRef.current.object.position.length();
        if (Math.abs(currentDist - targetDist) > 0.1) {
             controlsRef.current.object.position.setLength(
               THREE.MathUtils.lerp(currentDist, targetDist, delta * 2)
             );
        }
        return;
    }

    const isInteracting = gesture === HandGestureState.CLOSED && handDataRef.current.present;

    if (isInteracting) {
      const { x, z } = handDataRef.current;
      
      const targetAzimuth = (x - 0.5) * 4; 
      const zoomFactor = THREE.MathUtils.clamp((z - 0.1) / 0.3, 0, 1);
      const targetDistance = THREE.MathUtils.lerp(35, 12, zoomFactor);

      smoothRef.current.azimuth += (targetAzimuth - smoothRef.current.azimuth) * delta * 5;
      smoothRef.current.distance += (targetDistance - smoothRef.current.distance) * delta * 5;

      controlsRef.current.setAzimuthalAngle(smoothRef.current.azimuth);
      controlsRef.current.object.position.setLength(smoothRef.current.distance);
      
      controlsRef.current.autoRotate = false;
    } else {
      controlsRef.current.autoRotate = gesture === HandGestureState.CLOSED;
       const targetDistance = 20;
       const currentDist = controlsRef.current.object.position.length();
       if (Math.abs(currentDist - targetDistance) > 0.1) {
         controlsRef.current.object.position.setLength(
           THREE.MathUtils.lerp(currentDist, targetDistance, delta * 0.5)
         );
       }
    }
    
    controlsRef.current.update();
  });

  return (
    <OrbitControls 
      ref={controlsRef}
      enablePan={false} 
      enableZoom={true} 
      minDistance={10} 
      maxDistance={40} 
      autoRotateSpeed={0.5}
      enableDamping={true}
      dampingFactor={0.05}
    />
  );
};

export const Experience: React.FC<ExperienceProps> = ({ gesture, theme, handDataRef, photos }) => {
  return (
    <Canvas dpr={[1, 2]} gl={{ antialias: false, alpha: false }}>
      <color attach="background" args={[theme.background]} />
      
      <PerspectiveCamera makeDefault position={[0, 2, 20]} fov={50} />
      
      <CameraController gesture={gesture} handDataRef={handDataRef} />

      <ambientLight intensity={0.2} color={theme.background} />
      <pointLight position={[10, 10, 10]} intensity={1} color={theme.light} />
      <spotLight 
        position={[0, 20, 0]} 
        angle={0.5} 
        penumbra={1} 
        intensity={2} 
        color={theme.light} 
        castShadow 
      />

      <Suspense fallback={null}>
        <LuxParticles gesture={gesture} theme={theme} />
        {photos.length > 0 && <PhotoGallery photos={photos} gesture={gesture} />}
        <Environment preset="city" />
        <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />
      </Suspense>

      <EffectComposer disableNormalPass>
        <Bloom 
          luminanceThreshold={0.2} 
          mipmapBlur 
          intensity={1.5} 
          radius={0.4}
          color={theme.glow}
        />
        <Vignette eskil={false} offset={0.1} darkness={0.5} />
        <Noise opacity={0.02} />
      </EffectComposer>
    </Canvas>
  );
};