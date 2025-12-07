
import React, { useMemo } from 'react';
import { ShapeType, TreeItemData } from '../types';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface OrnamentProps {
  data: TreeItemData;
  exploded?: boolean;
}

const Ornament: React.FC<OrnamentProps> = ({ data, exploded = false }) => {
  const { position, rotation, scale, type, color } = data;
  
  // Create refs for materials to animate opacity
  const materialRef = React.useRef<THREE.MeshStandardMaterial>(null);

  useFrame((state, delta) => {
    if (materialRef.current) {
        // Target opacity: 1 if normal, 0 if exploded (completely invisible)
        const targetOpacity = exploded ? 0 : 1;
        materialRef.current.opacity = THREE.MathUtils.lerp(materialRef.current.opacity, targetOpacity, delta * 3); // Faster fade
        materialRef.current.transparent = true; // Always enable transparency to allow fading
        
        // Optimization: Turn off visibility if effectively transparent
        materialRef.current.visible = materialRef.current.opacity > 0.01;
        materialRef.current.depthWrite = materialRef.current.opacity > 0.5;
    }
  });

  const geometry = useMemo(() => {
    return (
      <group position={position} rotation={rotation} scale={[scale, scale, scale]}>
        {type === ShapeType.SPHERE ? (
          <mesh castShadow receiveShadow>
            <sphereGeometry args={[0.5, 32, 32]} />
            <meshStandardMaterial
              ref={materialRef}
              color={color}
              metalness={0.9}
              roughness={0.15}
              envMapIntensity={1}
            />
          </mesh>
        ) : (
          <mesh castShadow receiveShadow>
            <boxGeometry args={[0.8, 0.8, 0.8]} />
            <meshStandardMaterial
              ref={materialRef}
              color={color}
              metalness={0.8}
              roughness={0.2}
              envMapIntensity={1}
            />
          </mesh>
        )}
      </group>
    );
  }, [position, rotation, scale, type, color]);

  return geometry;
};

export default Ornament;
