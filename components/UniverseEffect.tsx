import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { PALETTE } from '../types';

interface UniverseEffectProps {
  active: boolean;
}

interface ParticleBatchProps {
  char?: string;
  count: number;
  active: boolean;
  baseSize: number;
}

// Helper to generate a texture for a specific character
const useCharTexture = (char?: string) => {
  return useMemo(() => {
    if (!char) return null; // Default circle texture will be used if null

    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 128;
    const ctx = canvas.getContext('2d');
    
    if (ctx) {
      ctx.clearRect(0, 0, 128, 128);
      ctx.font = 'bold 90px "Bodoni Moda", serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      
      // Add a glow effect to the text in the texture
      ctx.shadowColor = '#FFD700';
      ctx.shadowBlur = 10;
      ctx.fillStyle = '#FFFFFF';
      ctx.fillText(char, 64, 64);
    }
    
    const texture = new THREE.CanvasTexture(canvas);
    texture.needsUpdate = true;
    return texture;
  }, [char]);
};

const ParticleBatch: React.FC<ParticleBatchProps> = ({ char, count, active, baseSize }) => {
  const pointsRef = useRef<THREE.Points>(null);
  const texture = useCharTexture(char);

  // Generate random positions and colors
  const [initialPositions, targetPositions, colors] = useMemo(() => {
    const initials = new Float32Array(count * 3); // Start at 0,0,0
    const targets = new Float32Array(count * 3);
    const cols = new Float32Array(count * 3);
    const colorObj = new THREE.Color();

    for (let i = 0; i < count; i++) {
      // 1. Initial Position (Center)
      initials[i * 3] = 0;
      initials[i * 3 + 1] = 0;
      initials[i * 3 + 2] = 0;

      // 2. Target Position (Spherical Cloud)
      // Radius varies to create depth
      const r = 10 + Math.random() * 25; 
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      
      targets[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      targets[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      targets[i * 3 + 2] = r * Math.cos(phi);

      // 3. Colors
      if (char) {
        // Letters are bright white/gold
        colorObj.set('#FFF8E7'); 
      } else {
        // Dots are mixed gold/red/white
        const rnd = Math.random();
        if (rnd > 0.6) colorObj.set(PALETTE.GOLD);
        else if (rnd > 0.8) colorObj.set(PALETTE.DEEP_GOLD);
        else colorObj.set('#ffffff'); 
      }

      cols[i * 3] = colorObj.r;
      cols[i * 3 + 1] = colorObj.g;
      cols[i * 3 + 2] = colorObj.b;
    }

    return [initials, targets, cols];
  }, [count, char]);

  useFrame((state, delta) => {
    if (!pointsRef.current) return;
    
    const positions = pointsRef.current.geometry.attributes.position.array as Float32Array;
    // Faster expansion when active
    const lerpFactor = active ? 2.0 : 1.0; 
    
    for(let i = 0; i < count; i++) {
        const ix = i * 3;
        
        // Target is 0,0,0 if not active (implode), or the random cloud position if active (explode)
        const tx = active ? targetPositions[ix] : 0;
        const ty = active ? targetPositions[ix+1] : 0;
        const tz = active ? targetPositions[ix+2] : 0;
        
        // Linear Interpolation
        positions[ix] += (tx - positions[ix]) * delta * lerpFactor;
        positions[ix+1] += (ty - positions[ix+1]) * delta * lerpFactor;
        positions[ix+2] += (tz - positions[ix+2]) * delta * lerpFactor;
        
        // Add gentle float animation when active
        if (active) {
             const time = state.clock.elapsedTime;
             // Unique offset for each particle based on index
             positions[ix] += Math.sin(time * 0.5 + i) * 0.01;
             positions[ix+1] += Math.cos(time * 0.3 + i) * 0.01;
        }
    }
    pointsRef.current.geometry.attributes.position.needsUpdate = true;
    
    // Always face camera if it's text? PointsMaterial handles this automatically (billboarding)
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={count}
          array={initialPositions}
          itemSize={3}
        />
        <bufferAttribute
          attach="attributes-color"
          count={count}
          array={colors}
          itemSize={3}
        />
      </bufferGeometry>
      {/* 
         If texture is provided, use it. 
         Note: PointsMaterial with map renders the texture on every point.
      */}
      <pointsMaterial
        map={texture || undefined}
        size={baseSize}
        vertexColors
        transparent
        opacity={active ? 1 : 0}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
        sizeAttenuation={true}
        alphaTest={0.01}
      />
    </points>
  );
};

const UniverseEffect: React.FC<UniverseEffectProps> = ({ active }) => {
  return (
    <group>
      {/* 
        We separate the particles into batches. 
        Batch 1-4: The Characters (A, Z, 6, 8).
        Batch 5: The "Stardust" (dots).
      */}
      
      {/* Character Batches - Larger Size for Visibility */}
      <ParticleBatch char="A" count={120} active={active} baseSize={1.2} />
      <ParticleBatch char="Z" count={120} active={active} baseSize={1.2} />
      <ParticleBatch char="6" count={120} active={active} baseSize={1.2} />
      <ParticleBatch char="8" count={120} active={active} baseSize={1.2} />

      {/* Stardust Batch - Small Dots, High Count */}
      <ParticleBatch char={undefined} count={2500} active={active} baseSize={0.25} />
    </group>
  );
};

export default UniverseEffect;