import React, { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { HandGestureState, ThemeConfig } from '../types';
import { PARTICLE_COUNT, TREE_HEIGHT, TREE_RADIUS, EXPLOSION_RADIUS } from '../constants';

interface LuxParticlesProps {
  gesture: HandGestureState;
  theme: ThemeConfig;
}

export const LuxParticles: React.FC<LuxParticlesProps> = ({ gesture, theme }) => {
  const pointsRef = useRef<THREE.Points>(null);
  
  // Initialize particle data - Recalculate when theme changes
  const { positions, colors, randoms, originalPositions } = useMemo(() => {
    const pos = new Float32Array(PARTICLE_COUNT * 3);
    const originalPos = new Float32Array(PARTICLE_COUNT * 3);
    const cols = new Float32Array(PARTICLE_COUNT * 3);
    const rands = new Float32Array(PARTICLE_COUNT * 3);

    const color1 = new THREE.Color(theme.secondary);
    const color2 = new THREE.Color(theme.primary);

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      // 1. Generate Tree Shape (Spiral Cone)
      // Percentage of height (0 to 1)
      const p = i / PARTICLE_COUNT;
      const h = p * TREE_HEIGHT - (TREE_HEIGHT / 2); // Center y around 0
      
      // Radius decreases as height increases
      const r = (1 - p) * TREE_RADIUS;
      
      // Spiral angle
      const angle = p * 50 + (Math.random() * 0.5); // 50 full rotations roughly

      // Add some randomness for volume
      const variance = 0.5;
      const x = Math.cos(angle) * r + (Math.random() - 0.5) * variance;
      const y = h + (Math.random() - 0.5) * variance;
      const z = Math.sin(angle) * r + (Math.random() - 0.5) * variance;

      pos[i * 3] = x;
      pos[i * 3 + 1] = y;
      pos[i * 3 + 2] = z;

      originalPos[i * 3] = x;
      originalPos[i * 3 + 1] = y;
      originalPos[i * 3 + 2] = z;

      // 2. Colors (Gradient from Theme Secondary to Primary)
      // Mix factor based on height
      const mixedColor = color1.clone().lerp(color2, Math.random() * p + 0.2);
      cols[i * 3] = mixedColor.r;
      cols[i * 3 + 1] = mixedColor.g;
      cols[i * 3 + 2] = mixedColor.b;

      // 3. Random vector for explosion direction
      rands[i * 3] = (Math.random() - 0.5) * 2; // vx
      rands[i * 3 + 1] = (Math.random() - 0.5) * 2; // vy
      rands[i * 3 + 2] = (Math.random() - 0.5) * 2; // vz
    }

    return { 
      positions: pos, 
      colors: cols, 
      randoms: rands,
      originalPositions: originalPos 
    };
  }, [theme.id]); // Re-run if theme ID changes

  useFrame((state, delta) => {
    if (!pointsRef.current) return;

    const geometry = pointsRef.current.geometry;
    const positionAttribute = geometry.getAttribute('position');
    const isExploding = gesture === HandGestureState.OPEN;

    // Time factor for smooth animation
    const t = state.clock.elapsedTime;
    // Damping factor for movement
    const damping = isExploding ? 2.0 : 4.0; 

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const ix = i * 3;
      const iy = i * 3 + 1;
      const iz = i * 3 + 2;

      // Current pos
      let cx = positionAttribute.getX(i);
      let cy = positionAttribute.getY(i);
      let cz = positionAttribute.getZ(i);

      // Target pos calculation
      let tx, ty, tz;

      if (isExploding) {
        // Explosion logic: drift outwards based on random vector
        const rDirX = randoms[ix];
        const rDirY = randoms[iy];
        const rDirZ = randoms[iz];

        // Create a large spherical galaxy feel
        tx = rDirX * EXPLOSION_RADIUS + Math.sin(t * 0.5 + i) * 2;
        ty = rDirY * EXPLOSION_RADIUS * 0.5 + Math.cos(t * 0.3 + i) * 2; 
        tz = rDirZ * EXPLOSION_RADIUS + Math.sin(t * 0.5 + i * 0.5) * 2;
      } else {
        // Reformation logic: Return to tree shape
        tx = originalPositions[ix];
        ty = originalPositions[iy];
        tz = originalPositions[iz];
        
        // Add subtle sparkle movement when in tree form
        tx += Math.sin(t * 2 + i) * 0.05;
        ty += Math.cos(t * 3 + i) * 0.05;
        tz += Math.sin(t * 2 + i) * 0.05;
      }

      // Interpolate current to target
      // Lerp formula: current + (target - current) * factor
      const moveSpeed = delta * damping;
      cx += (tx - cx) * moveSpeed;
      cy += (ty - cy) * moveSpeed;
      cz += (tz - cz) * moveSpeed;

      positionAttribute.setXYZ(i, cx, cy, cz);
    }

    positionAttribute.needsUpdate = true;
    
    // Slowly rotate the whole system for grandeur
    if (isExploding) {
      pointsRef.current.rotation.y += delta * 0.05;
    } else {
      pointsRef.current.rotation.y += delta * 0.1;
    }
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={positions.length / 3}
          array={positions}
          itemSize={3}
        />
        <bufferAttribute
          attach="attributes-color"
          count={colors.length / 3}
          array={colors}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.15}
        vertexColors
        transparent
        opacity={0.8}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
        sizeAttenuation={true}
      />
    </points>
  );
};