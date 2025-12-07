
import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Text3D, Center, Sparkles } from '@react-three/drei';
import { Group, MeshStandardMaterial, MathUtils } from 'three';
import { PALETTE } from '../types';

interface TreeTopperProps {
  position: [number, number, number];
  exploded?: boolean;
}

const TreeTopper: React.FC<TreeTopperProps> = ({ position, exploded = false }) => {
  const groupRef = useRef<Group>(null);
  const materialRef = useRef<MeshStandardMaterial>(null);
  
  // Using Gentilis (Serif) to approximate the Vogue/Bodoni aesthetic in standard Three.js fonts
  const fontUrl = 'https://threejs.org/examples/fonts/gentilis_bold.typeface.json';

  useFrame((state, delta) => {
    if (groupRef.current) {
      // Gentle floating animation relative to the mount point
      groupRef.current.position.y = Math.sin(state.clock.elapsedTime * 1.5) * 0.05;
      // Slow rotation to show off the 3D depth
      groupRef.current.rotation.y += 0.005;
    }

    if (materialRef.current) {
        // Fade out text if exploded
        const targetOpacity = exploded ? 0 : 1;
        materialRef.current.opacity = MathUtils.lerp(materialRef.current.opacity, targetOpacity, delta * 3);
        materialRef.current.transparent = true;
        materialRef.current.visible = materialRef.current.opacity > 0.01;
    }
  });

  return (
    <group position={position}>
      {/* Animated container for the text */}
      <group ref={groupRef}>
        {/* Align text bottom to the origin so it sits ON the stick */}
        <Center bottom>
          <Text3D
            font={fontUrl}
            size={1.2} // Slightly smaller for elegance
            height={0.3} // Thinner extrusion
            curveSegments={12}
            bevelEnabled
            bevelThickness={0.01} // Sharper edges
            bevelSize={0.015}
            bevelOffset={0}
            bevelSegments={3}
          >
            AZ
            <meshStandardMaterial
              ref={materialRef}
              color={PALETTE.GOLD}
              metalness={1}
              roughness={0.05} // Very polished
              emissive={PALETTE.GOLD}
              emissiveIntensity={0.3}
            />
          </Text3D>
        </Center>
      </group>

      {/* Rod removed as requested to allow floating text */}
      
      {/* Extra sparkles around the topper - Hide when exploded */}
      {!exploded && (
        <Sparkles 
            count={40} 
            scale={3} 
            size={4} 
            speed={0.2} 
            opacity={0.6}
            color="#FFF"
            position={[0, 0, 0]}
        />
      )}
      
      {/* A point light to make the top glow specifically - Turn off when exploded */}
      <pointLight 
        position={[0, 0.5, 1]} 
        intensity={exploded ? 0 : 8} 
        color={PALETTE.GOLD} 
        distance={6} 
      />
    </group>
  );
};

export default TreeTopper;
