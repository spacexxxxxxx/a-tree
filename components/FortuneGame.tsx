
import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { Text3D, Float, Center, Sparkles } from '@react-three/drei';
import * as THREE from 'three';
import { PALETTE } from '../types';

interface FortuneGameProps {
  active: boolean;
  onCollect: (count: number) => void;
  onFinish: () => void;
}

interface Target {
  id: number;
  char: 'A' | 'Z';
  position: THREE.Vector3;
  collected: boolean;
}

interface CoinTargetProps {
  position: THREE.Vector3;
  char: string;
  fontUrl: string;
  onCollect: () => void;
}

const FortuneGame: React.FC<FortuneGameProps> = ({ active, onCollect, onFinish }) => {
  const [targets, setTargets] = useState<Target[]>([]);
  const [score, setScore] = useState(0);
  const fontUrl = 'https://threejs.org/examples/fonts/gentilis_bold.typeface.json';
  
  // Initialize game targets when game becomes active
  useEffect(() => {
    if (active) {
      const newTargets: Target[] = [];
      const count = 5; // Number of items to find
      
      for (let i = 0; i < count; i++) {
        // SCATTER WIDELY: Radius between 15 and 40 to force universe search
        const r = 15 + Math.random() * 25;
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.acos(2 * Math.random() - 1);
        
        const x = r * Math.sin(phi) * Math.cos(theta);
        const y = r * Math.cos(phi);
        const z = r * Math.sin(phi) * Math.sin(theta);

        newTargets.push({
          id: i,
          char: Math.random() > 0.5 ? 'A' : 'Z',
          position: new THREE.Vector3(x, y, z),
          collected: false
        });
      }
      setTargets(newTargets);
      setScore(0);
      onCollect(0);
    } else {
        setTargets([]);
    }
  }, [active]);

  const handlePointerDown = (id: number) => {
    const targetIndex = targets.findIndex(t => t.id === id);
    if (targetIndex === -1 || targets[targetIndex].collected) return;

    // Update State
    const newTargets = [...targets];
    newTargets[targetIndex].collected = true;
    setTargets(newTargets);
    
    const newScore = score + 1;
    setScore(newScore);
    onCollect(newScore);

    if (newScore >= targets.length) {
      setTimeout(onFinish, 1000);
    }
  };

  if (!active) return null;

  return (
    <group>
      {targets.map((target) => (
        !target.collected && (
          <CoinTarget 
            key={target.id}
            position={target.position}
            char={target.char}
            fontUrl={fontUrl}
            onCollect={() => handlePointerDown(target.id)}
          />
        )
      ))}
    </group>
  );
};

// Sub-component for the individual Coin target (Bitcoin style)
const CoinTarget: React.FC<CoinTargetProps> = ({ position, char, fontUrl, onCollect }) => {
    const meshRef = useRef<THREE.Group>(null);
    const beaconRef = useRef<THREE.Mesh>(null);
    
    useFrame((state, delta) => {
        if (meshRef.current) {
            // Spin on Y axis like a coin
            meshRef.current.rotation.y += delta * 2.5; 
            // Slight bobbing tilt
            meshRef.current.rotation.z = Math.sin(state.clock.elapsedTime * 2) * 0.1;
        }
        if (beaconRef.current) {
            // Beacon pulse effect
            const opacity = 0.2 + Math.sin(state.clock.elapsedTime * 4) * 0.1;
            (beaconRef.current.material as THREE.MeshBasicMaterial).opacity = opacity;
        }
    });

    return (
        <group position={position} onClick={(e) => { e.stopPropagation(); onCollect(); }}>
            <Float speed={2} rotationIntensity={0.2} floatIntensity={1}>
                {/* 1. Invisible Hit Sphere (Larger for easier clicking) */}
                <mesh visible={false}>
                    <sphereGeometry args={[4, 16, 16]} />
                    <meshBasicMaterial color="red" />
                </mesh>

                {/* 2. Beacon Beam (UX Improvement: Helps find targets in the void) */}
                <mesh ref={beaconRef} rotation={[Math.PI/2, 0, 0]}>
                    <cylinderGeometry args={[0.08, 0.08, 150, 8]} /> {/* Slightly thicker beam */}
                    <meshBasicMaterial color={PALETTE.GOLD} transparent opacity={0.2} depthWrite={false} blending={THREE.AdditiveBlending} />
                </mesh>

                {/* 3. The Rotating Coin Group */}
                <group ref={meshRef}>
                    {/* Coin Body (Cylinder) */}
                    <mesh rotation={[Math.PI/2, 0, 0]}>
                        <cylinderGeometry args={[1.2, 1.2, 0.2, 64]} />
                        <meshStandardMaterial 
                            color={PALETTE.GOLD} 
                            metalness={1.0} 
                            roughness={0.25}
                            envMapIntensity={1.5}
                        />
                    </mesh>
                    
                    {/* Coin Rim (Torus) */}
                    <mesh rotation={[Math.PI/2, 0, 0]}>
                        <torusGeometry args={[1.2, 0.1, 16, 64]} />
                        <meshStandardMaterial 
                             color={PALETTE.DEEP_GOLD} 
                             metalness={1.0} 
                             roughness={0.2} 
                        />
                    </mesh>

                    {/* Content Logic: Double Sided Text */}
                    {/* Front Text */}
                    <group position={[0, 0, 0.12]}>
                        <Center>
                             <Text3D
                                font={fontUrl}
                                size={1.0}
                                height={0.05}
                                curveSegments={12}
                                bevelEnabled
                                bevelThickness={0.02}
                                bevelSize={0.02}
                                bevelOffset={0}
                                bevelSegments={3}
                            >
                                {char}
                                <meshStandardMaterial
                                    color="#FFFFFF"
                                    emissive={PALETTE.GOLD}
                                    emissiveIntensity={0.6}
                                    metalness={0.8}
                                    roughness={0.1}
                                />
                            </Text3D>
                        </Center>
                    </group>

                    {/* Back Text (Rotated 180 deg) */}
                    <group position={[0, 0, -0.12]} rotation={[0, Math.PI, 0]}>
                        <Center>
                             <Text3D
                                font={fontUrl}
                                size={1.0}
                                height={0.05}
                                curveSegments={12}
                                bevelEnabled
                                bevelThickness={0.02}
                                bevelSize={0.02}
                                bevelOffset={0}
                                bevelSegments={3}
                            >
                                {char}
                                <meshStandardMaterial
                                    color="#FFFFFF"
                                    emissive={PALETTE.GOLD}
                                    emissiveIntensity={0.6}
                                    metalness={0.8}
                                    roughness={0.1}
                                />
                            </Text3D>
                        </Center>
                    </group>
                </group>

                {/* 4. Effects */}
                {/* Glow Light */}
                <pointLight distance={6} intensity={8} color={PALETTE.GOLD} />
                
                {/* Sparkles */}
                <Sparkles 
                    count={30} 
                    scale={4} 
                    size={6} 
                    speed={0.6} 
                    opacity={1}
                    color="#FFD700"
                />
            </Float>
        </group>
    );
};

export default FortuneGame;
