import React, { useRef, useState } from 'react';
import { useFrame, useLoader } from '@react-three/fiber';
import * as THREE from 'three';
import { UserPhoto, HandGestureState } from '../types';

interface PolaroidProps {
  photo: UserPhoto;
  isSelected: boolean;
  gesture: HandGestureState;
}

const Polaroid: React.FC<PolaroidProps> = ({ photo, isSelected, gesture }) => {
  const meshRef = useRef<THREE.Group>(null);
  const texture = useLoader(THREE.TextureLoader, photo.url);
  
  // Smooth animation values
  const targetPos = useRef(new THREE.Vector3(...photo.position));
  const targetRot = useRef(new THREE.Euler(...photo.rotation));
  const targetScale = useRef(0); // Start at 0 for pop-in effect

  useFrame((state, delta) => {
    if (!meshRef.current) return;

    const isPinched = gesture === HandGestureState.PINCH;
    const t = state.clock.elapsedTime;

    // Logic: If this is the NEAREST photo AND user is pinching (OK Sign) -> Bring to center of SCREEN
    if (isSelected && isPinched) {
      // 1. Calculate position relative to CAMERA
      // Place it 4 units in front of the camera.
      // This ensures it is always "in the middle" of the view, regardless of camera rotation/position.
      const offset = new THREE.Vector3(0, 0, -4);
      offset.applyQuaternion(state.camera.quaternion);
      const target = state.camera.position.clone().add(offset);
      
      targetPos.current.copy(target);

      // 2. Rotation: Face the camera
      // We create a dummy Object3D to easily calculate the 'LookAt' rotation quaternion -> Euler
      const dummy = new THREE.Object3D();
      dummy.position.copy(target);
      dummy.lookAt(state.camera.position);
      
      // Apply the rotation
      targetRot.current.copy(dummy.rotation);

      // 3. Add subtle "levitation" relative to camera frame?
      // For now, locked to center is best for "Show in middle". 
      // Maybe a tiny bit of sway to keep it alive.
      // We apply sway in local space effectively by modifying the result slightly or just relying on the camera's own potential micromovements.
      // Let's add a very subtle Z-roll for style.
      targetRot.current.z += Math.sin(t * 0.5) * 0.02;

      targetScale.current = 2.5; // Scale appropriate for distance of 4 units
    } else {
      // Revert to tree position
      targetPos.current.set(...photo.position);
      targetRot.current.set(...photo.rotation);
      targetScale.current = 1;
      
      // Add floating animation when on tree (idle state)
      const offset = parseInt(photo.id.slice(-4)) || 0; 
      targetPos.current.y += Math.sin(t * 1.5 + offset) * 0.003;
      
      // Idle rotation sway
      targetRot.current.z += Math.cos(t + offset) * 0.001;
    }

    // Interpolation - Use a smoother, slower factor for "Grand" feel
    const lerpSpeed = 3.0;

    meshRef.current.position.lerp(targetPos.current, delta * lerpSpeed);
    
    // Smooth rotation interpolation
    // Using Euler lerp is safe here as we don't expect gimbal lock in this constrained range
    meshRef.current.rotation.x = THREE.MathUtils.lerp(meshRef.current.rotation.x, targetRot.current.x, delta * lerpSpeed);
    meshRef.current.rotation.y = THREE.MathUtils.lerp(meshRef.current.rotation.y, targetRot.current.y, delta * lerpSpeed);
    meshRef.current.rotation.z = THREE.MathUtils.lerp(meshRef.current.rotation.z, targetRot.current.z, delta * lerpSpeed);
    
    // Scale Lerp
    const currentScale = meshRef.current.scale.x;
    const nextScale = THREE.MathUtils.lerp(currentScale, targetScale.current, delta * lerpSpeed);
    meshRef.current.scale.setScalar(nextScale);
  });

  return (
    <group ref={meshRef} position={photo.position} rotation={photo.rotation} scale={[0,0,0]}>
      {/* Photo Frame (White Background) - Polaroid Style */}
      <mesh position={[0, 0, -0.02]}>
        <planeGeometry args={[1.2, 1.4]} />
        <meshStandardMaterial 
          color="#f8f9fa" 
          roughness={0.4} 
          metalness={0.1}
          emissive="#ffffff"
          emissiveIntensity={0.1}
        />
      </mesh>

      {/* The Image */}
      <mesh position={[0, 0.1, 0.01]}>
        <planeGeometry args={[1, 1]} />
        <meshBasicMaterial map={texture} toneMapped={false} /> 
      </mesh>
      
      {/* Glossy overlay for photo glass effect */}
      <mesh position={[0, 0.1, 0.02]}>
        <planeGeometry args={[1, 1]} />
        <meshPhysicalMaterial 
          transparent 
          opacity={0.2} 
          roughness={0.0} 
          metalness={0.5} 
          clearcoat={1}
          color="#ffffff"
        />
      </mesh>

      {/* Shadow simulated backing */}
      <mesh position={[0, 0, -0.03]} scale={[1.05, 1.05, 1]}>
         <planeGeometry args={[1.2, 1.4]} />
         <meshBasicMaterial color="#000000" transparent opacity={0.3} />
      </mesh>
    </group>
  );
};

interface PhotoGalleryProps {
  photos: UserPhoto[];
  gesture: HandGestureState;
}

export const PhotoGallery: React.FC<PhotoGalleryProps> = ({ photos, gesture }) => {
  const [nearestId, setNearestId] = useState<string | null>(null);

  useFrame((state) => {
    if (photos.length === 0) return;

    let minDistanceSq = Infinity;
    let closestId = null;
    const camPos = state.camera.position;

    // Find the photo closest to the camera
    for (const photo of photos) {
      const dx = photo.position[0] - camPos.x;
      const dy = photo.position[1] - camPos.y;
      const dz = photo.position[2] - camPos.z;
      const distSq = dx * dx + dy * dy + dz * dz;

      if (distSq < minDistanceSq) {
        minDistanceSq = distSq;
        closestId = photo.id;
      }
    }

    if (closestId !== nearestId) {
      setNearestId(closestId);
    }
  });

  return (
    <group>
      {photos.map((photo) => (
        <Polaroid 
          key={photo.id} 
          photo={photo} 
          isSelected={photo.id === nearestId} 
          gesture={gesture}
        />
      ))}
    </group>
  );
};